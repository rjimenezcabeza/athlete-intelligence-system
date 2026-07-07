import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { frames, exercise, lang = 'es' } = body

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: 'No frames provided' }, { status: 400 })
    }
    if (frames.length > 6) {
      return NextResponse.json({ error: 'Max 6 frames allowed' }, { status: 400 })
    }

    const exerciseName = exercise || 'ejercicio desconocido'
    const isEs = lang === 'es'

    const systemPrompt = isEs
      ? `Eres un entrenador personal experto y biomecánico deportivo con más de 20 años de experiencia.
Analiza las imágenes de frames de vídeo de una ejecución de ejercicio.
Proporciona feedback técnico detallado, preciso y accionable.
Responde SIEMPRE en español. Sé específico, menciona lo que ves en las imágenes.
Estructura tu respuesta en JSON con los campos exactos especificados.`
      : `You are an expert personal trainer and sports biomechanics specialist with 20+ years of experience.
Analyze video frame images of an exercise execution.
Provide detailed, precise, and actionable technical feedback.
Be specific and mention what you actually see in the images.
Structure your response in JSON with the exact fields specified.`

    const analysisPrompt = isEs
      ? `Analiza estos ${frames.length} frame(s) del ejercicio: "${exerciseName}"

Devuelve SOLO un JSON con esta estructura exacta:
{
  "overall_score": <número del 1 al 10>,
  "overall_assessment": "<evaluación general en 2-3 frases>",
  "strengths": ["<punto fuerte 1>", "<punto fuerte 2>"],
  "corrections": [
    {
      "issue": "<problema identificado>",
      "severity": "<critical|moderate|minor>",
      "correction": "<cómo corregirlo>",
      "cue": "<señal verbal/cue corta para recordarlo>"
    }
  ],
  "technique_breakdown": {
    "postura_inicial": "<análisis de la postura de inicio>",
    "mecanica_movimiento": "<análisis del movimiento>",
    "control_muscular": "<análisis de la tensión y control>",
    "rango_movimiento": "<análisis del ROM>"
  },
  "injury_risk": "<none|low|moderate|high>",
  "injury_risk_notes": "<si hay riesgo, explicar cuál>",
  "next_session_focus": "<1-2 puntos clave para el próximo entrenamiento>",
  "drill_recommendation": "<ejercicio de corrección o drill recomendado>"
}`
      : `Analyze these ${frames.length} frame(s) of the exercise: "${exerciseName}"

Return ONLY JSON with this exact structure:
{
  "overall_score": <number 1-10>,
  "overall_assessment": "<general assessment in 2-3 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "corrections": [
    {
      "issue": "<identified issue>",
      "severity": "<critical|moderate|minor>",
      "correction": "<how to fix it>",
      "cue": "<short verbal cue to remember>"
    }
  ],
  "technique_breakdown": {
    "starting_position": "<analysis of starting position>",
    "movement_mechanics": "<movement analysis>",
    "muscular_control": "<tension and control analysis>",
    "range_of_motion": "<ROM analysis>"
  },
  "injury_risk": "<none|low|moderate|high>",
  "injury_risk_notes": "<if risk, explain which>",
  "next_session_focus": "<1-2 key points for next training>",
  "drill_recommendation": "<recommended correction exercise or drill>"
}`

    // Build message content with all frames as images
    const messageContent: Anthropic.MessageParam['content'] = [
      ...frames.map((frame: string) => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: frame.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      })),
      { type: 'text' as const, text: analysisPrompt },
    ]

    const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY ?? '').trim() })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleanText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let analysis
    try {
      analysis = JSON.parse(cleanText)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: rawText }, { status: 500 })
    }

    return NextResponse.json({ success: true, exercise: exerciseName, analysis, framesAnalyzed: frames.length })
  } catch (e) {
    console.error('[video/analyze] error:', e)
    return NextResponse.json({ error: 'Internal error', details: String(e) }, { status: 500 })
  }
}
