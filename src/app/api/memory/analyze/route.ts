import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/memory/analyze — analiza patrones del atleta y genera insights
// Se llama después de cada sesión completada
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id, language, training_experience_years')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await request.json()
  const { session_id } = body

  // 1. Obtener historial de ejercicios del atleta
  const { data: exerciseHistory } = await (supabase as any)
    .from('exercise_history')
    .select('*, exercises(name, muscle_group_primary)')
    .eq('athlete_id', profile.id)
    .order('last_logged_at', { ascending: false })
    .limit(20)

  // 2. Obtener últimas 8 sesiones
  const { data: recentSessions } = await (supabase as any)
    .from('training_sessions')
    .select('id, session_date, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, status, duration_minutes')
    .eq('athlete_id', profile.id)
    .eq('status', 'completed')
    .order('session_date', { ascending: false })
    .limit(8)

  const patternsGenerated: any[] = []

  // === DETECCIÓN DE PATRONES ===

  // Patrón 1: Plateau detectado (mismo peso 3+ sesiones consecutivas)
  if (exerciseHistory) {
    for (const exHist of exerciseHistory) {
      if (exHist.total_sessions >= 3 && exHist.weight_trend !== null) {
        if (Math.abs(exHist.weight_trend) < 0.1 && exHist.avg_rir_last4w !== null && exHist.avg_rir_last4w <= 1.5) {
          patternsGenerated.push({
            athlete_id: profile.id,
            pattern_type: 'plateau_detected',
            exercise_id: exHist.exercise_id,
            title_es: `Plateau en ${exHist.exercises?.name}`,
            title_en: `Plateau detected in ${exHist.exercises?.name}`,
            description_es: `Llevas varias sesiones sin progresar en ${exHist.exercises?.name} con RIR promedio de ${exHist.avg_rir_last4w?.toFixed(1)}. Es momento de ajustar el plan.`,
            description_en: `You've had several sessions without progress in ${exHist.exercises?.name} with avg RIR ${exHist.avg_rir_last4w?.toFixed(1)}. Time to adjust.`,
            severity: 'warning',
            context_data: {
              weight_trend: exHist.weight_trend,
              avg_rir: exHist.avg_rir_last4w,
              total_sessions: exHist.total_sessions
            }
          })
        }
      }
    }
  }

  // Patrón 2: Fatiga acumulada (local_fatigue >= 4 en últimas 3 sesiones)
  if (recentSessions && recentSessions.length >= 3) {
    const last3 = recentSessions.slice(0, 3)
    const avgFatigue = last3.reduce((sum: number, s: any) => sum + (s.local_fatigue || 0), 0) / 3
    if (avgFatigue >= 4) {
      patternsGenerated.push({
        athlete_id: profile.id,
        pattern_type: 'fatigue_accumulation',
        title_es: 'Fatiga acumulada detectada',
        title_en: 'Accumulated fatigue detected',
        description_es: `Tu fatiga local promedio en las últimas 3 sesiones es ${avgFatigue.toFixed(1)}/5. Considera reducir volumen o tomar un día extra de descanso.`,
        description_en: `Your avg local fatigue over the last 3 sessions is ${avgFatigue.toFixed(1)}/5. Consider reducing volume or taking an extra rest day.`,
        severity: 'warning',
        context_data: { avg_fatigue: avgFatigue, sessions: last3.map((s: any) => s.id) }
      })
    }
  }

  // Patrón 3: Deload sugerido (6+ sesiones sin deload, fatiga creciente)
  if (recentSessions && recentSessions.length >= 6) {
    const avgFatigue6 = recentSessions.slice(0, 6).reduce((sum: number, s: any) => sum + (s.local_fatigue || 0), 0) / 6
    const avgRecovery6 = recentSessions.slice(0, 6).reduce((sum: number, s: any) => sum + (s.perceived_recovery || 0), 0) / 6
    if (avgFatigue6 >= 3.5 && avgRecovery6 <= 2.5) {
      patternsGenerated.push({
        athlete_id: profile.id,
        pattern_type: 'deload_suggested',
        title_es: 'Semana de Deload recomendada',
        title_en: 'Deload week recommended',
        description_es: `6 sesiones consecutivas de alta fatiga (${avgFatigue6.toFixed(1)}/5) y baja recuperación (${avgRecovery6.toFixed(1)}/5). Una semana de deload optimizará tus adaptaciones.`,
        description_en: `6 consecutive sessions with high fatigue (${avgFatigue6.toFixed(1)}/5) and low recovery (${avgRecovery6.toFixed(1)}/5). A deload week will optimize your adaptations.`,
        severity: 'critical',
        context_data: { avg_fatigue: avgFatigue6, avg_recovery: avgRecovery6 }
      })
    }
  }

  // 3. Guardar patrones generados (evitar duplicados por tipo+ejercicio en las últimas 2 semanas)
  for (const pattern of patternsGenerated) {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: existing } = await (supabase as any)
      .from('athlete_patterns')
      .select('id')
      .eq('athlete_id', profile.id)
      .eq('pattern_type', pattern.pattern_type)
      .eq('exercise_id', pattern.exercise_id || null)
      .gte('created_at', twoWeeksAgo)
      .limit(1)
      .single()

    if (!existing) {
      await (supabase as any)
        .from('athlete_patterns')
        .insert(pattern)
    }
  }

  return NextResponse.json({
    success: true,
    patterns_generated: patternsGenerated.length,
    patterns: patternsGenerated
  })
}
