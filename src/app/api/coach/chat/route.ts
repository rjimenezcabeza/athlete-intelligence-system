import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: (process.env.ANTHROPIC_API_KEY ?? '').trim(),
})

function buildCoachSystemPrompt(context: any): string {
  const p = context.profile
  const t = context.training
  const m = context.mesocycle
  const prog = context.progression
  const dc = context.dataCompleteness
  const isEs = p.language === 'es'

  let prompt = isEs
    ? `Eres el AI Coach de AIS (Athlete Intelligence System). Eres un entrenador de hipertrofia de elite con acceso completo al historial real del atleta. Hablas en espanol, eres directo, preciso y no das respuestas genericas. Das consejos basados UNICAMENTE en los datos reales que tienes del atleta.

REGLA CRITICA: Jamas respondas con consejos genericos si tienes datos especificos. Usa SIEMPRE los datos concretos (pesos, series, fechas, musculos) en tus respuestas.

`
    : `You are the AIS (Athlete Intelligence System) AI Coach. You are an elite hypertrophy coach with full access to the athlete's real training history. You speak in English, are direct, precise, and never give generic answers. You give advice based ONLY on the real data you have about the athlete.

CRITICAL RULE: Never respond with generic advice if you have specific data. ALWAYS use concrete data (weights, sets, dates, muscles) in your responses.

`

  prompt += isEs ? `== DATOS DEL ATLETA ==\n` : `== ATHLETE DATA ==\n`
  prompt += `Nombre: ${p.name || 'Atleta'}\n`
  if (p.bodyWeightKg) prompt += `Peso corporal: ${p.bodyWeightKg}kg\n`
  if (p.experienceYears) prompt += `Experiencia: ${p.experienceYears} anos\n`
  prompt += `Objetivo: ${p.primaryGoal || 'hipertrofia'}\n`
  if (p.trainingProfile?.splitDetected) {
    prompt += `Split detectado: ${p.trainingProfile.splitDetected}, ${p.trainingProfile.daysPerWeek} dias/semana\n`
  }
  if (p.nutrition?.calories) {
    prompt += isEs
      ? `Nutricion: ${p.nutrition.calories}kcal/dia, ${p.nutrition.protein}g proteina\n`
      : `Nutrition: ${p.nutrition.calories}kcal/day, ${p.nutrition.protein}g protein\n`
  }
  prompt += '\n'

  prompt += isEs ? `== ESTADO ACTUAL ==\n` : `== CURRENT STATUS ==\n`
  if (t.totalCompletedSessions === 0) {
    prompt += isEs
      ? `Sin sesiones registradas aun. El atleta es nuevo en AIS.\n`
      : `No sessions logged yet. Athlete is new to AIS.\n`
  } else {
    prompt += isEs
      ? `Sesiones completadas: ${t.totalCompletedSessions}\n`
      : `Completed sessions: ${t.totalCompletedSessions}\n`
    if (t.daysSinceLastSession !== null) {
      prompt += isEs
        ? `Ultima sesion: hace ${t.daysSinceLastSession} dias (${t.lastSessionDate})\n`
        : `Last session: ${t.daysSinceLastSession} days ago (${t.lastSessionDate})\n`
    }
    if (t.avgPumpRating) {
      prompt += isEs
        ? `Pump promedio reciente: ${t.avgPumpRating}/5 | Fatiga promedio: ${t.avgFatigueRating}/5\n`
        : `Average recent pump: ${t.avgPumpRating}/5 | Average fatigue: ${t.avgFatigueRating}/5\n`
    }
  }

  if (m) {
    prompt += '\n'
    prompt += isEs ? `== MESOCICLO ACTIVO ==\n` : `== ACTIVE MESOCYCLE ==\n`
    prompt += isEs
      ? `"${m.name}" - Semana ${m.currentWeek} de ${m.totalWeeks}`
      : `"${m.name}" - Week ${m.currentWeek} of ${m.totalWeeks}`
    if (m.isDeloadWeek) {
      prompt += isEs ? ` (SEMANA DE DESCARGA)\n` : ` (DELOAD WEEK)\n`
    } else {
      prompt += `\n`
    }
    if (m.weeksRemaining <= 1) {
      prompt += isEs
        ? `ALERTA: El mesociclo esta llegando al final. Considera programar deload y nuevo bloque.\n`
        : `ALERT: Mesocycle is ending soon. Consider scheduling deload and new block.\n`
    }
    if (m.splitType) prompt += `Split: ${m.splitType}\n`
  }

  if (context.muscleVolume?.hasVolumeData) {
    prompt += '\n'
    prompt += isEs ? `== VOLUMEN SEMANAL (semana actual) ==\n` : `== WEEKLY VOLUME (current week) ==\n`
    for (const mv of context.muscleVolume.thisWeek) {
      const rir = mv.avgRir !== null ? ` @${mv.avgRir}RIR` : ''
      prompt += `${mv.muscle}: ${mv.sets} sets${rir}\n`
    }
  }

  if (prog.stallingExercises?.length > 0) {
    prompt += '\n'
    prompt += isEs
      ? `== EJERCICIOS ESTANCADOS (2+ sesiones sin progresar) ==\n`
      : `== STALLING EXERCISES (2+ sessions without progress) ==\n`
    for (const ex of prog.stallingExercises) {
      prompt += `${ex.name} (${ex.muscle}): ${ex.count} sesiones estancado\n`
    }
  }

  if (prog.recentSuggestions?.length > 0) {
    prompt += '\n'
    prompt += isEs ? `== SUGERENCIAS DE PROGRESION RECIENTES ==\n` : `== RECENT PROGRESSION SUGGESTIONS ==\n`
    for (const s of prog.recentSuggestions.slice(0, 5)) {
      const status = s.applied ? (isEs ? 'aplicada' : 'applied') : (isEs ? 'pendiente' : 'pending')
      prompt += `${s.exercise}: ${s.action} ${s.prevWeight ? `${s.prevWeight}kg -> ${s.newWeight}kg` : ''} [${status}]\n`
    }
  }

  if (context.exerciseHistory?.length > 0) {
    prompt += '\n'
    prompt += isEs ? `== RECORDS Y TENDENCIAS ==\n` : `== RECORDS AND TRENDS ==\n`
    for (const e of context.exerciseHistory.slice(0, 8)) {
      const trendIcon = e.trend === 'up' ? '↑' : e.trend === 'down' ? '↓' : '→'
      const pr = e.bestWeight ? `PR: ${e.bestWeight}kg` : ''
      const rm = e.estimated1rm ? ` | 1RM est: ${e.estimated1rm}kg` : ''
      const sess = e.sessions > 0 ? ` | ${e.sessions} sesiones` : ''
      prompt += `${e.name} ${trendIcon} ${pr}${rm}${sess}\n`
    }
  }

  if (context.recentPRs?.length > 0) {
    prompt += '\n'
    prompt += isEs ? `== PRs RECIENTES ==\n` : `== RECENT PRs ==\n`
    for (const pr of context.recentPRs) {
      prompt += `${pr.exercise}: ${pr.weight}kg x ${pr.reps} reps\n`
    }
  }

  if (context.patterns?.length > 0) {
    prompt += '\n'
    prompt += isEs ? `== PATRONES DETECTADOS ==\n` : `== DETECTED PATTERNS ==\n`
    for (const pat of context.patterns) {
      const title = isEs ? pat.title_es : pat.title_en
      const desc = isEs ? pat.description_es : pat.description_en
      prompt += `[${pat.severity.toUpperCase()}] ${title}: ${desc}\n`
    }
  }

  prompt += '\n'
  if (dc.score < 30) {
    prompt += isEs
      ? `NOTA: El atleta tiene pocos datos en AIS (${dc.score}% completitud). Tu primer objetivo es ayudarle a completar su perfil y hacer su primera sesion.\n`
      : `NOTE: Athlete has limited data in AIS (${dc.score}% completeness). Your first goal is to help them complete their profile and do their first session.\n`
  } else if (dc.score < 60) {
    prompt += isEs
      ? `El atleta tiene datos parciales. Usa los datos disponibles para dar consejos concretos.\n`
      : `Athlete has partial data. Use available data for concrete advice.\n`
  }

  prompt += '\n'
  prompt += isEs
    ? `== COMO DEBES RESPONDER ==
- Respuestas cortas y directas (maximo 3 parrafos)
- USA siempre los datos especificos del atleta (nombres de ejercicios, pesos, fechas)
- Si hay estancamiento, mencionalo con datos concretos
- Tono: entrenador personal de alto nivel, no un chatbot amigable generico
`
    : `== HOW TO RESPOND ==
- Short and direct responses (maximum 3 paragraphs)
- ALWAYS use athlete-specific data (exercise names, weights, dates)
- If there is stalling, mention it with concrete data
- Tone: high-level personal trainer, not a generic friendly chatbot
`
  return prompt
}

// POST /api/coach/chat
// Body: { message: string, conversation_history?: Array<{role, content}> }
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id, display_name, language, training_experience_years, primary_goal, subscription_tier, body_weight_kg, nutrition_calories_target, nutrition_protein_g, training_split_detected, training_days_detected, import_onboarded_at')
    .eq('user_id', user.id)
    .single()
  if (!profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 })
  }

  const body = await request.json()
  const { message, conversation_history = [] } = body

  if (!message || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 })
  }

  const athleteId = profile.id
  const lang = profile.language || 'es'

  const [
    sessionsResult,
    progressionResult,
    muscleVolumeResult,
    exerciseHistoryResult,
    mesocycleResult,
    patternsResult,
    stallingResult,
    recentPRsResult
  ] = await Promise.all([
    (supabase as any)
      .from('training_sessions')
      .select('id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, rir_session_avg')
      .eq('athlete_id', athleteId)
      .eq('status', 'completed')
      .order('session_date', { ascending: false })
      .limit(10),

    (supabase as any)
      .from('progression_log')
      .select('action_type, prev_weight_kg, new_weight_kg, applied, exercises(name, muscle_group_primary)')
      .eq('athlete_id', athleteId)
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20),

    (supabase as any)
      .from('muscle_group_history')
      .select('muscle_group, sets_count, avg_rir, week_start')
      .eq('athlete_id', athleteId)
      .order('week_start', { ascending: false })
      .limit(26),

    (supabase as any)
      .from('exercise_history')
      .select('best_weight_kg, weight_trend, total_sessions, best_1rm_estimated, exercise_id, exercises(name, muscle_group_primary)')
      .eq('athlete_id', athleteId)
      .order('total_sessions', { ascending: false })
      .limit(15),

    (supabase as any)
      .from('mesocycles')
      .select('name, current_week, total_weeks, deload_week, goal, training_templates(split_type)')
      .eq('athlete_id', athleteId)
      .eq('status', 'active')
      .maybeSingle(),

    (supabase as any)
      .from('athlete_patterns')
      .select('pattern_type, title_es, title_en, description_es, description_en, severity')
      .eq('athlete_id', athleteId)
      .eq('is_active', true)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(5),

    (supabase as any)
      .from('progression_log')
      .select('exercise_id, exercises(name, muscle_group_primary)')
      .eq('athlete_id', athleteId)
      .eq('action_type', 'maintain_weight')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(30),

    (supabase as any)
      .from('sets')
      .select(`
        weight_kg, reps_completed,
        session_exercises!inner(
          exercises!inner(name),
          training_sessions!inner(athlete_id, status)
        )
      `)
      .eq('session_exercises.training_sessions.athlete_id', athleteId)
      .eq('session_exercises.training_sessions.status', 'completed')
      .eq('is_personal_record', true)
      .eq('set_type', 'working')
      .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10)
  ])

  const sessions = sessionsResult.data || []
  const progressionLogs = progressionResult.data || []
  const muscleVolume = muscleVolumeResult.data || []
  const exerciseHistory = exerciseHistoryResult.data || []
  const mesocycle = mesocycleResult.data
  const patterns = patternsResult.data || []
  const stallingRaw = stallingResult.data || []
  const recentPRsRaw = recentPRsResult.data || []

  const stallingCount: Record<string, { name: string; muscle: string; count: number }> = {}
  for (const log of stallingRaw) {
    const key = log.exercise_id
    if (!stallingCount[key]) {
      stallingCount[key] = { name: log.exercises?.name || 'Ejercicio', muscle: log.exercises?.muscle_group_primary || '', count: 0 }
    }
    stallingCount[key].count++
  }
  const stallingExercises = Object.values(stallingCount).filter(e => e.count >= 2)

  const totalSessions = sessions.length
  const lastSessionDate = sessions[0]?.session_date || null
  const daysSinceLastSession = lastSessionDate
    ? Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const withPump = sessions.filter((s: any) => s.pump_rating)
  const withFatigue = sessions.filter((s: any) => s.local_fatigue)
  const avgPump = withPump.length > 0
    ? Math.round(withPump.reduce((sum: number, s: any) => sum + s.pump_rating, 0) / withPump.length * 10) / 10
    : null
  const avgFatigue = withFatigue.length > 0
    ? Math.round(withFatigue.reduce((sum: number, s: any) => sum + s.local_fatigue, 0) / withFatigue.length * 10) / 10
    : null

  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
  monday.setHours(0, 0, 0, 0)
  const weekStartStr = monday.toISOString().split('T')[0]
  const thisWeekVolume = muscleVolume.filter((m: any) => m.week_start === weekStartStr)

  const dataScore = Math.round((
    (profile.body_weight_kg ? 1 : 0) +
    (profile.nutrition_calories_target ? 1 : 0) +
    (totalSessions > 0 ? 2 : 0) +
    (mesocycle ? 1 : 0) +
    (muscleVolume.length > 0 ? 1 : 0) +
    (progressionLogs.length > 0 ? 1 : 0)
  ) / 7 * 100)

  const context = {
    profile: {
      name: profile.display_name,
      bodyWeightKg: profile.body_weight_kg,
      experienceYears: profile.training_experience_years,
      primaryGoal: profile.primary_goal,
      language: lang,
      nutrition: { calories: profile.nutrition_calories_target, protein: profile.nutrition_protein_g },
      trainingProfile: { splitDetected: profile.training_split_detected, daysPerWeek: profile.training_days_detected }
    },
    training: { totalCompletedSessions: totalSessions, lastSessionDate, daysSinceLastSession, avgPumpRating: avgPump, avgFatigueRating: avgFatigue },
    mesocycle: mesocycle ? {
      name: mesocycle.name,
      currentWeek: mesocycle.current_week,
      totalWeeks: mesocycle.total_weeks,
      isDeloadWeek: mesocycle.deload_week === mesocycle.current_week,
      weeksRemaining: mesocycle.total_weeks - mesocycle.current_week,
      splitType: mesocycle.training_templates?.split_type
    } : null,
    muscleVolume: {
      thisWeek: thisWeekVolume.map((m: any) => ({ muscle: m.muscle_group, sets: m.sets_count, avgRir: m.avg_rir })),
      hasVolumeData: thisWeekVolume.length > 0
    },
    progression: {
      recentSuggestions: progressionLogs.slice(0, 10).map((p: any) => ({
        exercise: p.exercises?.name, action: p.action_type,
        prevWeight: p.prev_weight_kg, newWeight: p.new_weight_kg, applied: p.applied
      })),
      stallingExercises
    },
    exerciseHistory: exerciseHistory.slice(0, 10).map((e: any) => ({
      name: e.exercises?.name,
      muscle: e.exercises?.muscle_group_primary,
      bestWeight: e.best_weight_kg,
      trend: e.weight_trend > 0 ? 'up' : e.weight_trend < 0 ? 'down' : 'flat',
      sessions: e.total_sessions,
      estimated1rm: e.best_1rm_estimated
    })),
    patterns,
    recentPRs: recentPRsRaw.map((s: any) => ({
      exercise: s.session_exercises?.exercises?.name,
      weight: s.weight_kg,
      reps: s.reps_completed
    })).filter((p: any) => p.exercise),
    dataCompleteness: { score: dataScore }
  }

  const systemPrompt = buildCoachSystemPrompt(context)

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversation_history.slice(-6),
    { role: 'user', content: message }
  ]

  const encoder = new TextEncoder()
  let fullResponseText = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages
        })

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullResponseText += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        try {
          await (supabase as any)
            .from('ai_recommendations')
            .insert({
              athlete_id: athleteId,
              recommendation_type: 'coach_chat',
              recommendation_text: fullResponseText,
              reasoning: message,
              context_data: { conversation_length: messages.length, model: 'claude-sonnet-4-6' },
              ai_model: 'claude-sonnet-4-6',
              ai_provider: 'anthropic'
            })
        } catch {}

      } catch (error: any) {
        const errMsg = lang === 'es'
          ? 'Lo siento, el Coach no esta disponible ahora. Intenta de nuevo.'
          : 'Sorry, the Coach is unavailable right now. Please try again.'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: errMsg })}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
