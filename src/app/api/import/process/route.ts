import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

function db() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  )
}

const PROMPT = `You are a fitness data extractor for the Athlete Intelligence System.
Analyze the training data and extract structured workout information.
Return ONLY valid JSON, no markdown, no explanation:
{
  "confidence": 0.0-1.0,
  "extraction_notes": "brief description",
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
    const { importId, userId } = await req.json()
    if (!importId || !userId) return NextResponse.json({ error: 'importId and userId required' }, { status: 400 })

    const supabase = db()

    // Verify ownership: athlete profile must belong to userId AND imported_file must belong to that athlete
    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', userId).single()
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
      const ext = importRecord.storage_path.split('.').pop()?.toLowerCase() ?? 'jpeg'
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/jpeg'
      }
      const mimeType = (mimeMap[ext] ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: PROMPT }
        ]}]
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      extractedData = JSON.parse(text.replace(/```json|```/g, '').trim())
    } else {
      let textContent = ''
      try { textContent = await fileData.text() } catch { textContent = 'Could not extract text' }
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: PROMPT + '\n\nData:\n\n' + textContent.slice(0, 8000) }]
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      extractedData = JSON.parse(text.replace(/```json|```/g, '').trim())
    }

    const confidence = extractedData?.confidence ?? 0

    if (extractedData?.sessions?.length > 0) {
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

    return NextResponse.json({ success: true, confidence, sessionsFound: extractedData?.sessions?.length ?? 0, status: newStatus })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
