import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// POST /api/coach/chat
// Body: { message: string, conversation_history?: Array<{role, content}> }
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id, display_name, language, training_experience_years, primary_goal, subscription_tier, body_weight_kg')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await request.json()
  const { message, conversation_history = [] } = body

  if (!message || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const lang = profile.language || 'es'

  // === CONSTRUIR CONTEXTO HISTÓRICO ===

  const { data: recentSessions } = await (supabase as any)
    .from('training_sessions')
    .select('id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, status')
    .eq('athlete_id', profile.id)
    .eq('status', 'completed')
    .order('session_date', { ascending: false })
    .limit(5)

  const { data: topExercises } = await (supabase as any)
    .from('exercise_history')
    .select('*, exercises(name, muscle_group_primary)')
    .eq('athlete_id', profile.id)
    .order('total_sessions', { ascending: false })
    .limit(5)

  const { data: activePatterns } = await (supabase as any)
    .from('athlete_patterns')
    .select('pattern_type, title_es, title_en, severity')
    .eq('athlete_id', profile.id)
    .eq('is_active', true)
    .eq('is_dismissed', false)
    .limit(5)

  const { data: progressionLogs } = await (supabase as any)
    .from('progression_log')
    .select('*, exercises(name)')
    .eq('athlete_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: sessionCount } = await (supabase as any)
    .from('training_sessions')
    .select('id', { count: 'exact' })
    .eq('athlete_id', profile.id)
    .eq('status', 'completed')

  const athleteContext = `
ATHLETE PROFILE:
- Name: ${profile.display_name}
- Experience: ${profile.training_experience_years || 'Unknown'} years
- Primary goal: ${profile.primary_goal || 'hypertrophy'}
- Body weight: ${profile.body_weight_kg ? profile.body_weight_kg + 'kg' : 'not specified'}
- Total completed sessions: ${sessionCount?.length || 0}
- Subscription: ${profile.subscription_tier}

RECENT SESSIONS (last 5):
${recentSessions ? recentSessions.map((s: any) =>
  `- ${s.session_date}: pump=${s.pump_rating || '?'}/5, fatigue=${s.local_fatigue || '?'}/5, recovery=${s.perceived_recovery || '?'}/5, RIR avg=${s.rir_session_avg || '?'}, duration=${s.duration_minutes || '?'}min`
).join('\n') : 'No sessions yet'}

TOP EXERCISES (by frequency):
${topExercises ? topExercises.map((e: any) =>
  `- ${e.exercises?.name}: ${e.total_sessions} sessions, best=${e.best_weight_kg || '?'}kg, avg RIR last 4w=${e.avg_rir_last4w || '?'}, 1RM est.=${e.best_1rm_estimated?.toFixed(1) || '?'}kg`
).join('\n') : 'No exercise history yet'}

ACTIVE PATTERNS/INSIGHTS:
${activePatterns && activePatterns.length > 0 ? activePatterns.map((p: any) =>
  `- [${p.severity.toUpperCase()}] ${lang === 'en' ? p.title_en : p.title_es}`
).join('\n') : 'No active patterns'}

RECENT PROGRESSION RECOMMENDATIONS:
${progressionLogs ? progressionLogs.map((p: any) =>
  `- ${p.exercises?.name}: ${p.action_type} (${p.prev_weight_kg}kg → ${p.new_weight_kg}kg), applied=${p.applied}`
).join('\n') : 'No progression data yet'}
`

  const systemPrompt = lang === 'en'
    ? `You are an elite AI strength & hypertrophy coach inside the AIS (Athlete Intelligence System) app. You have deep knowledge of the athlete's real training data. Be direct, specific, evidence-based, and use the athlete's actual data in your responses. Keep responses concise (max 3-4 paragraphs). Avoid generic advice — always reference their specific numbers.

${athleteContext}

Respond in English. Be conversational but authoritative.`
    : `Eres un coach de élite en fuerza e hipertrofia dentro de la app AIS (Athlete Intelligence System). Tienes acceso al historial real de entrenamiento del atleta. Sé directo, específico, basado en evidencia y usa los datos reales del atleta en tus respuestas. Respuestas concisas (máx 3-4 párrafos). Evita consejos genéricos — siempre referencia sus números específicos.

${athleteContext}

Responde en español. Sé conversacional pero con autoridad.`

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversation_history.slice(-6),
    { role: 'user', content: message }
  ]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    })

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    await (supabase as any)
      .from('ai_recommendations')
      .insert({
        athlete_id: profile.id,
        recommendation_type: 'coach_chat',
        recommendation_text: responseText,
        reasoning: message,
        context_data: {
          conversation_length: messages.length,
          model: 'claude-sonnet-4-6'
        },
        ai_model: 'claude-sonnet-4-6',
        ai_provider: 'anthropic'
      })

    return NextResponse.json({
      success: true,
      response: responseText,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      }
    })

  } catch (error: any) {
    console.error('AI Coach error:', error)
    return NextResponse.json({
      error: lang === 'en' ? 'AI Coach temporarily unavailable' : 'AI Coach temporalmente no disponible',
      details: error.message
    }, { status: 500 })
  }
}
