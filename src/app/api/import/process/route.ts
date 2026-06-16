import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

async function createDb() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      }
    }
  )
}

const EXTRACTION_PROMPT = `You are a fitness data extractor for the Athlete Intelligence System.
Analyze the training data and extract structured workout information.

Return ONLY valid JSON, no markdown, no explanation:
{
  "confidence": 0.0-1.0,
  "extraction_notes": "Brief description of what was found",
  "sessions": [
    {
      "date": "YYYY-MM-DD or null",
      "notes": "session notes or null",
      "exercises": [
        {
          "name": "exercise name",
          "muscle_group": "chest/back/shoulders/arms/legs/core/glutes/calves",
          "sets": [
            { "set_number": 1, "weight_kg": 80.0, "reps": 8, "rir": null, "set_type": "working" }
          ]
        }
      ]
    }
  ]
}

Rules:
- Convert lbs to kg (divide by 2.205) if lbs detected
- set_type: warmup, working, top_set, or backoff
- If no clear training data found, set confidence below 0.3
- Extract ALL sessions in the data`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createDb()
    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { importId } = await req.json()
    if (!importId) return NextResponse.json({ error: 'importId required' }, { status: 400 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: importRecord } = await (supabase as any)
      .from('imported_files').select('*').eq('id', importId).eq('athlete_id', profile.id).single()
    if (!importRecord) return NextResponse.json({ error: 'Import not found' }, { status: 404 })

    await (supabase as any).from('imported_files').update({ import_status: 'processing' }).eq('id', importId)

    const { data: fileData, error: dlError } = await (supabase as any).storage
      .from('imports').download(importRecord.storage_path)
    if (dlError) throw dlError

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    let extractedData: any = null

    if (importRecord.file_type === 'image') {
      const bytes = await fileData.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg' as any, data: base64 } },
            { type: 'text', text: EXTRACTION_PROMPT }
          ]
        }]
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      extractedData = JSON.parse(text.replace(/```json|```/g, '').trim())
    } else {
      let textContent = ''
      try { textContent = await fileData.text() } catch { textContent = 'Could not extract text' }
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nData:\n\n${textContent.slice(0, 8000)}`
        }]
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      extractedData = JSON.parse(text.replace(/```json|```/g, '').trim())
    }

    const confidence = extractedData?.confidence ?? 0

    if (extractedData?.sessions && extractedData.sessions.length > 0) {
      const reviewItems = extractedData.sessions.map((session: any) => ({
        imported_file_id: importId,
        item_type: 'session',
        raw_extracted: session,
        review_status: 'pending',
        confidence_score: confidence
      }))
      await (supabase as any).from('import_review_items').insert(reviewItems)
    }

    const newStatus = confidence < 0.3 ? 'error' : 'review_required'
    await (supabase as any)
      .from('imported_files')
      .update({
        import_status: newStatus,
        extracted_data: extractedData,
        extraction_confidence: confidence,
        extraction_notes: extractedData?.extraction_notes ?? '',
        processed_at: new Date().toISOString()
      })
      .eq('id', importId)

    return NextResponse.json({
      success: true,
      confidence,
      sessionsFound: extractedData?.sessions?.length ?? 0,
      status: newStatus
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
