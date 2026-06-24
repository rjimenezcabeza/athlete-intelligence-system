import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const EXTRACTION_SYSTEM_PROMPT = `Eres un experto en analisis de programas de entrenamiento para hipertrofia.
Tu tarea es extraer datos estructurados de documentos de entrenamiento y nutricion.

SIEMPRE devuelves un JSON valido con esta estructura exacta (null para campos no encontrados):

{
  "athlete": {
    "display_name": null,
    "body_weight_kg": null,
    "height_cm": null,
    "age": null,
    "gender": null,
    "training_experience_years": null,
    "primary_goal": null
  },
  "nutrition": {
    "calories_target": null,
    "protein_g": null,
    "carbs_g": null,
    "fat_g": null,
    "meals_per_day": null,
    "notes": null
  },
  "training_program": {
    "name": null,
    "split_type": null,
    "days_per_week": null,
    "mesocycle_weeks": null,
    "days": [
      {
        "day_number": 1,
        "day_label": "Push",
        "exercises": [
          {
            "name": "Press Banca",
            "sets": 4,
            "rep_range_min": 8,
            "rep_range_max": 12,
            "rir_target": 2,
            "rest_seconds": 120,
            "notes": null
          }
        ]
      }
    ]
  },
  "training_sessions": [
    {
      "date": "2024-01-15",
      "day_label": null,
      "exercises": [
        {
          "name": "Press Banca",
          "sets": [
            {
              "set_number": 1,
              "weight_kg": 80,
              "reps": 8,
              "rir": 2,
              "set_type": "working"
            }
          ]
        }
      ]
    }
  ],
  "confidence": 0.85,
  "notes": null
}

Si es texto de Excel/CSV, analiza todas las columnas y filas para encontrar datos de entrenamiento.
Normaliza pesos: si estan en lbs, convierte a kg (divide entre 2.2046).
Para split_type usa: PPL, Upper/Lower, Torso/Pierna, Full Body, Bro Split, Arnold Split.
primary_goal acepta: hypertrophy, strength, weight_loss, endurance.
confidence va de 0 a 1 segun tu certeza de extraccion.
NUNCA devuelvas texto extra, solo el JSON.`

async function excelToText(buffer: ArrayBuffer): Promise<string> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  let text = ''
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet, { skipHidden: true })
    if (csv.trim().length > 0) {
      text += `=== HOJA: ${sheetName} ===\n${csv}\n\n`
    }
  }
  return text.slice(0, 80000)
}

function fuzzyMatchExercise(importedName: string, exercises: any[]): any | null {
  if (!importedName || !exercises?.length) return null
  const normalize = (s: string) => s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()

  const target = normalize(importedName)
  let best: any = null
  let bestScore = 0

  for (const ex of exercises) {
    const candidate = normalize(ex.name || '')
    const targetWords = target.split(/\s+/).filter((w: string) => w.length > 2)
    const candidateWords = candidate.split(/\s+/).filter((w: string) => w.length > 2)
    const common = targetWords.filter((w: string) =>
      candidateWords.some((c: string) => c.includes(w) || w.includes(c))
    ).length
    const score = targetWords.length > 0 ? common / Math.max(targetWords.length, candidateWords.length) : 0
    if (score > bestScore && score >= 0.35) {
      bestScore = score
      best = { ...ex, matchConfidence: score }
    }
  }
  return best
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const importedFileId = body.importedFileId || body.importId

    if (!importedFileId) {
      return NextResponse.json({ error: 'Missing importedFileId' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: importedFile } = await (supabase as any)
      .from('imported_files')
      .select('id, original_filename, file_type, storage_path, import_status')
      .eq('id', importedFileId)
      .eq('athlete_id', profile.id)
      .single()

    if (!importedFile) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    // Mark as processing
    await (supabase as any)
      .from('imported_files')
      .update({ import_status: 'processing' })
      .eq('id', importedFileId)

    // Download from storage — try stored path first, then fallback variations
    let fileData: any = null

    const attempt1 = await (supabase as any)
      .storage.from('imports').download(importedFile.storage_path)
    console.error('[import/process] attempt1 path:', importedFile.storage_path, 'error:', JSON.stringify(attempt1.error))

    if (attempt1.data) {
      fileData = attempt1.data
    } else {
      // Fallback: try just the filename (no folder prefix)
      const pathParts = (importedFile.storage_path as string).split('/')
      const filename = pathParts[pathParts.length - 1]
      const attempt2 = await (supabase as any)
        .storage.from('imports').download(filename)
      console.error('[import/process] attempt2 path:', filename, 'error:', JSON.stringify(attempt2.error))
      if (attempt2.data) {
        fileData = attempt2.data
      }
    }

    if (!fileData) {
      await (supabase as any)
        .from('imported_files')
        .update({
          import_status: 'error',
          extraction_notes: `Download failed. Path: ${importedFile.storage_path}. File may not exist in storage — please re-upload.`
        })
        .eq('id', importedFileId)
      return NextResponse.json({
        error: 'Failed to download file from storage',
        storagePath: importedFile.storage_path,
        hint: 'File may not exist in storage. Re-upload the file.'
      }, { status: 500 })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY ?? '').trim() })

    let extractedData: any = null
    let extractionNotes = ''

    const filename = importedFile.original_filename || ''
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].includes(ext)
    const isPDF = ext === 'pdf'
    const isExcel = ['xlsx', 'xls', 'xlsm', 'xlsb', 'csv'].includes(ext) || importedFile.file_type === 'excel'

    try {
      let messageContent: any[]

      if (isImage) {
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/jpeg' }
        const mimeType = mimeMap[ext] ?? 'image/jpeg'
        messageContent = [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: 'Analiza esta imagen de entrenamiento/nutricion y extrae todos los datos. Devuelve SOLO el JSON.' }
        ]
      } else if (isPDF) {
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        messageContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: 'Analiza este PDF de entrenamiento/nutricion. Devuelve SOLO el JSON.' }
        ]
      } else if (isExcel) {
        const textContent = await excelToText(arrayBuffer)
        console.log('[import/process] excel text len:', textContent.length)
        messageContent = [
          { type: 'text', text: `Analiza este contenido de hoja de calculo de entrenamiento/nutricion y extrae todos los datos estructurados:\n\n${textContent}\n\nDevuelve SOLO el JSON sin ningun texto adicional ni backticks.` }
        ]
      } else {
        const textContent = Buffer.from(arrayBuffer).toString('utf-8').slice(0, 80000)
        messageContent = [
          { type: 'text', text: `Analiza este contenido de entrenamiento/nutricion:\n\n${textContent}\n\nDevuelve SOLO el JSON sin ningun texto adicional ni backticks.` }
        ]
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }]
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
      const cleanText = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      extractedData = JSON.parse(cleanText)
    } catch (aiError) {
      extractionNotes = `AI extraction failed: ${aiError instanceof Error ? aiError.message : 'unknown'}`
      console.error('[import/process] AI error:', aiError)
    }

    if (!extractedData) {
      await (supabase as any)
        .from('imported_files')
        .update({
          import_status: 'error',
          extraction_notes: extractionNotes,
          processed_at: new Date().toISOString()
        })
        .eq('id', importedFileId)
      return NextResponse.json({ error: 'Extraction failed', notes: extractionNotes }, { status: 422 })
    }

    // Fuzzy match exercises against DB
    const { data: dbExercises } = await (supabase as any)
      .from('exercises')
      .select('id, name, muscle_group_primary')
      .eq('is_global', true)

    const processedDays = (extractedData.training_program?.days ?? []).map((day: any) => ({
      ...day,
      exercises: (day.exercises ?? []).map((ex: any) => ({
        ...ex,
        matched_exercise: fuzzyMatchExercise(ex.name, dbExercises || [])
      }))
    }))

    const enrichedData = {
      ...extractedData,
      training_program: {
        ...extractedData.training_program,
        days: processedDays
      }
    }

    // Create review items
    const reviewItems: any[] = []
    if (extractedData.athlete || extractedData.nutrition) {
      reviewItems.push({
        imported_file_id: importedFileId,
        item_type: 'template',
        raw_extracted: { type: 'profile', athlete: extractedData.athlete, nutrition: extractedData.nutrition },
        review_status: 'pending',
        confidence_score: extractedData.confidence || 0.8
      })
    }
    for (const session of (extractedData.training_sessions || [])) {
      reviewItems.push({
        imported_file_id: importedFileId,
        item_type: 'session',
        raw_extracted: session,
        review_status: 'pending',
        confidence_score: extractedData.confidence || 0.8
      })
    }
    if (reviewItems.length > 0) {
      await (supabase as any).from('import_review_items').insert(reviewItems)
    }

    const totalExercisesInProgram = processedDays.reduce(
      (sum: number, d: any) => sum + (d.exercises?.length || 0), 0
    )
    const mappedExercises = processedDays.reduce(
      (sum: number, d: any) => sum + (d.exercises?.filter((e: any) => e.matched_exercise)?.length || 0), 0
    )

    await (supabase as any)
      .from('imported_files')
      .update({
        import_status: 'review_required',
        extracted_data: enrichedData,
        extraction_confidence: extractedData.confidence || 0.8,
        extraction_notes: extractedData.notes,
        processed_at: new Date().toISOString()
      })
      .eq('id', importedFileId)

    return NextResponse.json({
      success: true,
      status: 'review_required',
      importedFileId,
      confidence: extractedData.confidence,
      sessionsFound: extractedData.training_sessions?.length || 0,
      hasProgram: processedDays.length > 0,
      hasProfile: !!(extractedData.athlete || extractedData.nutrition),
      hasNutrition: !!(extractedData.nutrition?.calories_target || extractedData.nutrition?.protein_g),
      extracted: {
        hasProfile: !!(extractedData.athlete || extractedData.nutrition),
        hasProgram: processedDays.length > 0,
        hasSessions: !!(extractedData.training_sessions?.length),
        hasNutrition: !!(extractedData.nutrition?.calories_target || extractedData.nutrition?.protein_g),
        confidence: extractedData.confidence,
        summary: {
          athleteName: extractedData.athlete?.display_name,
          splitDetected: extractedData.training_program?.split_type,
          daysPerWeek: extractedData.training_program?.days_per_week,
          sessionsCount: extractedData.training_sessions?.length || 0,
          exercisesInProgram: totalExercisesInProgram,
          mappedExercises,
          calories: extractedData.nutrition?.calories_target,
          protein: extractedData.nutrition?.protein_g
        }
      }
    })
  } catch (error) {
    console.error('[import/process] error:', error)
    return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 })
  }
}
