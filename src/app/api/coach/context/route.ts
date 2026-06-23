import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
      .select('id, display_name, body_weight_kg, training_experience_years, primary_goal, language, weight_unit, nutrition_calories_target, nutrition_protein_g, nutrition_carbs_g, nutrition_fat_g, training_split_detected, training_days_detected, import_onboarded_at')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const athleteId = profile.id

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
        .select('id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, status')
        .eq('athlete_id', athleteId)
        .eq('status', 'completed')
        .order('session_date', { ascending: false })
        .limit(10),

      (supabase as any)
        .from('progression_log')
        .select('action_type, prev_weight_kg, new_weight_kg, new_reps_target, reasoning_es, reasoning_en, applied, created_at, exercises(name, muscle_group_primary)')
        .eq('athlete_id', athleteId)
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20),

      (supabase as any)
        .from('muscle_group_history')
        .select('muscle_group, sets_count, volume_kg, avg_rir, week_start')
        .eq('athlete_id', athleteId)
        .order('week_start', { ascending: false })
        .limit(26),

      (supabase as any)
        .from('exercise_history')
        .select('best_weight_kg, avg_weight_last4w, weight_trend, total_sessions, best_1rm_estimated, exercise_id, exercises(name, muscle_group_primary)')
        .eq('athlete_id', athleteId)
        .order('total_sessions', { ascending: false })
        .limit(15),

      (supabase as any)
        .from('mesocycles')
        .select('name, current_week, total_weeks, status, deload_week, started_at, goal, training_templates(name, split_type)')
        .eq('athlete_id', athleteId)
        .eq('status', 'active')
        .maybeSingle(),

      (supabase as any)
        .from('athlete_patterns')
        .select('pattern_type, title_es, title_en, description_es, description_en, severity, created_at')
        .eq('athlete_id', athleteId)
        .eq('is_active', true)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(5),

      (supabase as any)
        .from('progression_log')
        .select('exercise_id, action_type, exercises(name, muscle_group_primary)')
        .eq('athlete_id', athleteId)
        .eq('action_type', 'maintain_weight')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(30),

      (supabase as any)
        .from('sets')
        .select(`
          weight_kg, reps_completed, is_personal_record,
          session_exercises!inner(
            exercises!inner(name, muscle_group_primary),
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
        stallingCount[key] = {
          name: log.exercises?.name || 'Ejercicio',
          muscle: log.exercises?.muscle_group_primary || '',
          count: 0
        }
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

    const recentPRs = recentPRsRaw.map((s: any) => ({
      exercise: s.session_exercises?.exercises?.name,
      weight: s.weight_kg,
      reps: s.reps_completed
    })).filter((p: any) => p.exercise)

    return NextResponse.json({
      profile: {
        name: profile.display_name,
        bodyWeightKg: profile.body_weight_kg,
        experienceYears: profile.training_experience_years,
        primaryGoal: profile.primary_goal,
        language: profile.language,
        weightUnit: profile.weight_unit,
        nutrition: {
          calories: profile.nutrition_calories_target,
          protein: profile.nutrition_protein_g,
          carbs: profile.nutrition_carbs_g,
          fat: profile.nutrition_fat_g
        },
        trainingProfile: {
          splitDetected: profile.training_split_detected,
          daysPerWeek: profile.training_days_detected
        },
        hasImportedData: !!profile.import_onboarded_at
      },
      training: {
        totalCompletedSessions: totalSessions,
        lastSessionDate,
        daysSinceLastSession,
        avgPumpRating: avgPump,
        avgFatigueRating: avgFatigue,
        recentSessions: sessions.slice(0, 5).map((s: any) => ({
          date: s.session_date,
          durationMinutes: s.duration_minutes,
          pumpRating: s.pump_rating,
          fatigue: s.local_fatigue,
          recovery: s.perceived_recovery,
          avgRir: s.rir_session_avg
        }))
      },
      mesocycle: mesocycle ? {
        name: mesocycle.name,
        currentWeek: mesocycle.current_week,
        totalWeeks: mesocycle.total_weeks,
        isDeloadWeek: mesocycle.deload_week === mesocycle.current_week,
        weeksRemaining: mesocycle.total_weeks - mesocycle.current_week,
        templateName: mesocycle.training_templates?.name,
        splitType: mesocycle.training_templates?.split_type,
        goal: mesocycle.goal
      } : null,
      muscleVolume: {
        thisWeek: thisWeekVolume.map((m: any) => ({
          muscle: m.muscle_group,
          sets: m.sets_count,
          avgRir: m.avg_rir
        })),
        hasVolumeData: thisWeekVolume.length > 0
      },
      progression: {
        recentSuggestions: progressionLogs.slice(0, 10).map((p: any) => ({
          exercise: p.exercises?.name,
          muscle: p.exercises?.muscle_group_primary,
          action: p.action_type,
          prevWeight: p.prev_weight_kg,
          newWeight: p.new_weight_kg,
          applied: p.applied,
          reasoning: profile.language === 'es' ? p.reasoning_es : p.reasoning_en
        })),
        stallingExercises,
        hasStallingIssues: stallingExercises.length >= 2
      },
      exerciseHistory: exerciseHistory.slice(0, 10).map((e: any) => ({
        name: e.exercises?.name,
        muscle: e.exercises?.muscle_group_primary,
        bestWeight: e.best_weight_kg,
        avgWeightLast4w: e.avg_weight_last4w,
        trend: e.weight_trend > 0 ? 'up' : e.weight_trend < 0 ? 'down' : 'flat',
        sessions: e.total_sessions,
        estimated1rm: e.best_1rm_estimated
      })),
      patterns,
      recentPRs,
      dataCompleteness: {
        hasProfile: !!(profile.body_weight_kg || profile.training_experience_years),
        hasNutrition: !!(profile.nutrition_calories_target),
        hasSessions: totalSessions > 0,
        hasMesocycle: !!mesocycle,
        hasVolumeHistory: muscleVolume.length > 0,
        hasProgressionHistory: progressionLogs.length > 0,
        score: Math.round((
          (profile.body_weight_kg ? 1 : 0) +
          (profile.nutrition_calories_target ? 1 : 0) +
          (totalSessions > 0 ? 2 : 0) +
          (mesocycle ? 1 : 0) +
          (muscleVolume.length > 0 ? 1 : 0) +
          (progressionLogs.length > 0 ? 1 : 0)
        ) / 7 * 100)
      }
    })
  } catch (error) {
    console.error('[coach/context]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
