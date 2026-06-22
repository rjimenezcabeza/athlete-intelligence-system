import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { inflateRawSync } from 'zlib'

export const maxDuration = 60

function adminDb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function resolveUserId(bodyUserId: string): Promise<string | null> {
  if (bodyUserId && bodyUserId.length > 10) return bodyUserId
  try {
    const store = await cookies()
    const supa = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll() { return store.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supa.auth.getUser()
    return user?.id ?? null
  } catch (e) {
    console.error('[resolveUserId error]', e)
    return null
  }
}

function ascii(s: string, max = 6000): string {
  let o = ''
  for (let i = 0; i < s.length && o.length < max; i++) {
    const c = s.charCodeAt(i)
    if ((c >= 32 && c <= 126) || c === 10 || c === 13 || c === 9) o += s[i]
  }
  return o.trim()
}

function safeParseJSON(text: string): any {
  try { return JSON.parse(text.trim()) } catch {}
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s !== -1 && e > s) { try { return JSON.parse(text.slice(s, e + 1)) } catch {} }
  return { confidence: 0, extraction_notes: 'parse_error', sessions: [] }
}

function readZipEntry(buf: Buffer, filename: string): Buffer | null {
  let pos = 0
  while (pos < buf.length - 30) {
    if (buf.readUInt32LE(pos) !== 0x04034b50) { pos++; continue }
    const compression = buf.readUInt16LE(pos + 8)
    const compressedSize = buf.readUInt32LE(pos + 18)
    const fnLen = buf.readUInt16LE(pos + 26)
    const extraLen = buf.readUInt16LE(pos + 28)
    const fn = buf.slice(pos + 30, pos + 30 + fnLen).toString('utf8')
    const dataStart = pos + 30 + fnLen + extraLen
    const dataEnd = dataStart + compressedSize
    if (fn === filename || fn.endsWith('/' + filename)) {
      const data = buf.slice(dataStart, Math.min(dataEnd, buf.length))
      try {
        if (compression === 0) return data
        if (compression === 8) return inflateRawSync(data)
      } catch { return null }
    }
    pos = dataEnd > pos + 1 ? dataEnd : pos + 1
  }
  return null
}

function xlsxToText(buffer: Buffer): string {
  const lines: string[] = []
  try {
    const ssXml = readZipEntry(buffer, 'xl/sharedStrings.xml')
    const ss: string[] = []
    if (ssXml) {
      const xml = ssXml.toString('utf8')
      const reSi = new RegExp('<si>[\\s\\S]*?<\\/si>', 'g')
      const reT  = new RegExp('<t[^>]*>([^<]*)<\\/t>', 'g')
      const blocks = xml.match(reSi) ?? []
      for (const si of blocks) {
        const tags = si.match(new RegExp('<t[^>]*>([^<]*)<\\/t>', 'g')) ?? []
        ss.push(ascii(tags.map(t => t.replace(new RegExp('<[^>]+>', 'g'), '').trim()).join(' '), 150))
      }
    }
    console.log('[xlsx] sharedStrings count:', ss.length)
    const reRow  = new RegExp('<row[^>]*>[\\s\\S]*?<\\/row>', 'g')
    const reCell = new RegExp('<c[^>]*>[\\s\\S]*?<\\/c>', 'g')
    const reV    = new RegExp('<v>([^<]*)<\\/v>')
    for (let n = 1; n <= 3; n++) {
      const sheetXml = readZipEntry(buffer, 'xl/worksheets/sheet' + n + '.xml')
      if (!sheetXml) break
      const xml = sheetXml.toString('utf8')
      lines.push('--- Sheet ' + n + ' ---')
      const rows = xml.match(reRow) ?? []
      console.log('[xlsx] sheet' + n + ' rows:', rows.length)
      for (const row of rows.slice(0, 150)) {
        const cells = row.match(reCell) ?? []
        const vals: string[] = []
        for (const cell of cells) {
          const tM = cell.match(/t="([^"]+)"/)
          const vM = cell.match(reV)
          if (tM && tM[1] === 's' && vM) vals.push(ss[parseInt(vM[1], 10)] ?? '')
          else if (vM) vals.push(ascii(vM[1], 30))
        }
        const line = vals.filter(Boolean).join(' | ')
        if (line.length > 2) lines.push(line)
      }
    }
  } catch (e) {
    console.error('[xlsxToText error]', e)
    lines.push('xlsx error: ' + ascii(String(e), 80))
  }
  const result = lines.join('\n').slice(0, 6000)
  console.log('[xlsx] final text length:', result.length, 'preview:', result.slice(0, 100))
  return result || 'No content'
}

const SCHEMA = `{
  "athlete": {"display_name":null,"body_weight_kg":null,"height_cm":null,"training_experience_years":null,"primary_goal":null},
  "nutrition": {"calories_target":null,"protein_g":null,"carbs_g":null,"fat_g":null,"meals_per_day":null,"notes":null},
  "training_program": {
    "name":null,"split_type":null,"days_per_week":null,"mesocycle_weeks":null,
    "days":[{"day_number":1,"day_label":"Push","exercises":[{"name":"Press Banca","sets":4,"rep_range_min":8,"rep_range_max":12,"rir_target":2,"rest_seconds":120,"notes":null}]}]
  },
  "training_sessions": [{"date":"2024-01-15","day_label":"Push A","exercises":[{"name":"Press Banca","sets":[{"set_number":1,"weight_kg":80.0,"reps":8,"rir":2,"set_type":"working"}]}]}],
  "confidence":0.85,
  "notes":null
}`

const SYSTEM_PROMPT = `Eres un experto en análisis de programas de entrenamiento para hipertrofia.
Extrae TODOS los datos disponibles: perfil del atleta, nutrición, programa de entrenamiento y sesiones históricas.
Normaliza pesos: si están en lbs, convierte a kg (divide entre 2.2046).
Para split_type usa: PPL, Upper/Lower, Torso/Pierna, Full Body, Bro Split, Arnold Split.
primary_goal acepta: hypertrophy, strength, weight_loss, endurance.
Si alguna sección no existe en el documento, usa null o array vacío.
Devuelve SOLO JSON válido sin backticks ni texto adicional.`

export async function POST(req: NextRequest) {
  let importId = ''
  const admin = adminDb()

  try {
    // Leer body con manejo de errores
    let body: any = {}
    try {
      const rawBody = await req.text()
      console.log('[process] raw body:', rawBody.slice(0, 200))
      body = JSON.parse(rawBody)
    } catch (parseErr) {
      console.error('[process] body parse failed:', parseErr)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    importId = String(body.importId ?? '')
    console.log('[process] importId:', importId, 'userId:', String(body.userId ?? '').slice(0, 8))

    if (!importId) return NextResponse.json({ error: 'importId requerido' }, { status: 400 })

    const userId = await resolveUserId(String(body.userId ?? ''))
    console.log('[process] resolved userId:', userId?.slice(0, 8) ?? 'null')
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', userId).single()
    console.log('[process] profile:', profile?.id?.slice(0, 8) ?? 'null')
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const { data: rec } = await (admin as any)
      .from('imported_files').select('*').eq('id', importId).eq('athlete_id', profile.id).single()
    console.log('[process] rec found:', !!rec, 'status:', rec?.import_status)
    if (!rec) return NextResponse.json({ error: 'Importacion no encontrada' }, { status: 404 })

    await (admin as any).from('imported_files').update({ import_status: 'processing' }).eq('id', importId)

    const { data: signed, error: signErr } = await (admin as any).storage
      .from('imports').createSignedUrl(String(rec.storage_path), 120)
    console.log('[process] signed url ok:', !!signed?.signedUrl, 'err:', signErr?.message)
    if (!signed?.signedUrl) throw new Error('Signed URL failed: ' + (signErr?.message ?? 'unknown'))

    const fetchRes = await fetch(String(signed.signedUrl))
    console.log('[process] download status:', fetchRes.status)
    if (!fetchRes.ok) throw new Error('Download failed: ' + fetchRes.status)
    const buf = Buffer.from(await fetchRes.arrayBuffer())
    console.log('[process] buffer size:', buf.length)

    const storagePath = String(rec.storage_path)
    const ext = (storagePath.split('.').pop() ?? '').toLowerCase()
    const isImg = ['jpg','jpeg','png','webp','gif'].includes(ext)
    const isXlsx = ['xlsx','xls','xlsm','xlsb'].includes(ext)
    console.log('[process] fileType:', isImg ? 'image' : isXlsx ? 'excel' : 'text', 'ext:', ext)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    let rawText = ''

    if (isImg) {
      const mimes: Record<string,string> = { jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif' }
      const mime = (mimes[ext] ?? 'image/jpeg') as 'image/jpeg'|'image/png'|'image/webp'|'image/gif'
      console.log('[process] calling anthropic for image...')
      const r = await anthropic.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mime, data: buf.toString('base64') } },
          { type: 'text', text: 'Analiza este documento y extrae todos los datos. Formato JSON exacto: ' + SCHEMA }
        ]}]
      })
      rawText = (r.content[0] as any).text ?? '{}'
    } else if (isXlsx) {
      const text = xlsxToText(buf)
      console.log('[process] calling anthropic for excel, text len:', text.length)
      const r = await anthropic.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: 'Extrae TODOS los datos de entrenamiento y nutrición. Formato JSON exacto: ' + SCHEMA + '\n\nDatos:\n' + text }]
      })
      rawText = (r.content[0] as any).text ?? '{}'
    } else {
      const text = ascii(buf.toString('utf8'), 6000)
      const r = await anthropic.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: 'Extrae todos los datos de entrenamiento y nutrición. Formato JSON exacto: ' + SCHEMA + '\n\n' + text }]
      })
      rawText = (r.content[0] as any).text ?? '{}'
    }

    console.log('[process] anthropic response len:', rawText.length, 'preview:', rawText.slice(0, 80))
    const extractedData = safeParseJSON(rawText)
    const confidence = Number(extractedData?.confidence ?? 0)

    // Soporte schema antiguo (solo sessions[]) y nuevo schema completo
    const legacySessions = (extractedData?.sessions ?? []).filter((s: any) => s?.exercises?.length > 0)
    const newSessions = (extractedData?.training_sessions ?? []).filter((s: any) => s?.exercises?.length > 0)
    const sessions = newSessions.length > 0 ? newSessions : legacySessions
    const hasProgram = !!(extractedData?.training_program?.days?.length)
    const hasProfile = !!(extractedData?.athlete)
    const hasNutrition = !!(extractedData?.nutrition?.calories_target || extractedData?.nutrition?.protein_g)
    console.log('[process] confidence:', confidence, 'sessions:', sessions.length, 'hasProgram:', hasProgram)

    // Guardar review items
    const reviewItems: any[] = []

    if (hasProfile || hasNutrition || hasProgram) {
      reviewItems.push({
        imported_file_id: importId, item_type: 'template',
        raw_extracted: {
          type: 'profile_nutrition_program',
          athlete: extractedData.athlete,
          nutrition: extractedData.nutrition,
          training_program: extractedData.training_program
        },
        review_status: 'pending', confidence_score: confidence
      })
    }

    for (const s of sessions) {
      reviewItems.push({
        imported_file_id: importId, item_type: 'session',
        raw_extracted: s, review_status: 'pending', confidence_score: confidence
      })
    }

    if (reviewItems.length > 0) {
      await (admin as any).from('import_review_items').insert(reviewItems)
    }

    const hasAnyData = sessions.length > 0 || hasProgram || hasProfile || hasNutrition
    const status = confidence < 0.3 || !hasAnyData ? 'error' : 'review_required'

    await (admin as any).from('imported_files').update({
      import_status: status,
      extracted_data: extractedData,
      extraction_confidence: confidence,
      extraction_notes: ascii(String(extractedData?.notes ?? extractedData?.extraction_notes ?? ''), 200),
      processed_at: new Date().toISOString()
    }).eq('id', importId)

    return NextResponse.json({
      success: true,
      confidence,
      status,
      sessionsFound: sessions.length,
      hasProgram,
      hasProfile,
      hasNutrition
    })

  } catch (e) {
    const msg = ascii(e instanceof Error ? e.message : String(e), 200)
    console.error('[process] CATCH ERROR:', msg)
    if (importId) {
      await (admin as any).from('imported_files')
        .update({ import_status: 'error', extraction_notes: msg }).eq('id', importId).catch(() => {})
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
