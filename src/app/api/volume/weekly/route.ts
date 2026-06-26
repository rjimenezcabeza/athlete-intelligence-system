import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const getSvc = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(getUrl(), getSvc(), {
    cookies: { getAll() { return store.getAll() }, setAll() {} }
  })
  return (await supa.auth.getUser()).data.user
}

function adminDb() {
  return createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
}

const VOLUME_LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  pecho:          { mev: 10, mav: 16, mrv: 22 },
  dorsales:       { mev: 10, mav: 16, mrv: 25 },
  espalda:        { mev: 10, mav: 16, mrv: 25 },
  deltoides:      { mev: 8,  mav: 16, mrv: 26 },
  biceps:         { mev: 8,  mav: 14, mrv: 26 },
  triceps:        { mev: 6,  mav: 14, mrv: 26 },
  cuadriceps:     { mev: 8,  mav: 16, mrv: 20 },
  isquiotibiales: { mev: 6,  mav: 12, mrv: 20 },
  gluteos:        { mev: 0,  mav: 16, mrv: 25 },
  gemelos:        { mev: 8,  mav: 16, mrv: 20 },
  core:           { mev: 0,  mav: 16, mrv: 25 },
  trapecios:      { mev: 0,  mav: 12, mrv: 26 },
  aductor:        { mev: 0,  mav: 12, mrv: 16 },
}

function getVolumeStatus(sets: number, lm: { mev: number; mav: number; mrv: number }) {
  if (sets === 0) return 'empty'
  if (sets < lm.mev) return 'below_mev'
  if (sets <= lm.mav) return 'optimal'
  if (sets <= lm.mrv) return 'high'
  return 'above_mrv'
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Calcular lunes de la semana actual
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Intentar con muscle_group_history primero
    const { data: weeklyData } = await (admin as any)
      .from('muscle_group_history')
      .select('muscle_group, sets_count, volume_kg, avg_rir')
      .eq('athlete_id', profile.id)
      .eq('week_start', weekStartStr)

    let muscleData: Record<string, { sets: number; volume: number; avgRir: number | null }> = {}

    if (weeklyData && weeklyData.length > 0) {
      for (const row of weeklyData) {
        muscleData[row.muscle_group] = {
          sets: row.sets_count,
          volume: Number(row.volume_kg),
          avgRir: row.avg_rir !== null ? Number(row.avg_rir) : null
        }
      }
    } else {
      // Fallback: calcular desde sesiones de esta semana
      const { data: completedSessions } = await (admin as any)
        .from('training_sessions')
        .select('id')
        .eq('athlete_id', profile.id)
        .eq('status', 'completed')
        .gte('session_date', weekStartStr)

      const sessionIds = (completedSessions ?? []).map((s: any) => s.id)

      if (sessionIds.length > 0) {
        const { data: sessionExercises } = await (admin as any)
          .from('session_exercises')
          .select('id, exercises(muscle_group_primary)')
          .in('session_id', sessionIds)

        const seIds = (sessionExercises ?? []).map((se: any) => se.id)
        const muscleMap: Record<string, string> = {}
        for (const se of sessionExercises ?? []) {
          muscleMap[se.id] = se.exercises?.muscle_group_primary ?? ''
        }

        if (seIds.length > 0) {
          const { data: sets } = await (admin as any)
            .from('sets')
            .select('session_exercise_id, weight_kg, reps_completed, rir_actual')
            .in('session_exercise_id', seIds)
            .eq('set_type', 'working')

          for (const s of sets ?? []) {
            const muscle = muscleMap[s.session_exercise_id]
            if (!muscle) continue
            if (!muscleData[muscle]) muscleData[muscle] = { sets: 0, volume: 0, avgRir: null }
            muscleData[muscle].sets += 1
            muscleData[muscle].volume += (s.weight_kg || 0) * (s.reps_completed || 0)
          }
        }
      }
    }

    const result = Object.keys(VOLUME_LANDMARKS).map(muscle => {
      const data = muscleData[muscle] ?? { sets: 0, volume: 0, avgRir: null }
      const lm = VOLUME_LANDMARKS[muscle]
      return {
        muscleGroup: muscle,
        setsThisWeek: data.sets,
        volumeKg: Math.round(data.volume),
        avgRir: data.avgRir,
        landmarks: lm,
        status: getVolumeStatus(data.sets, lm),
        percentOfMav: lm.mav > 0 ? Math.round((data.sets / lm.mav) * 100) : 0
      }
    })

    // Historical weekly volume (last 12 weeks) from sessions + sets
    const twelveWeeksAgo = new Date(now)
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
    const { data: historicSessions } = await (admin as any)
      .from('training_sessions')
      .select('id, session_date')
      .eq('athlete_id', profile.id)
      .eq('status', 'completed')
      .gte('session_date', twelveWeeksAgo.toISOString().split('T')[0])
      .order('session_date', { ascending: true })

    const weekHistoryMap = new Map<string, { volume: number; sessions: number; prs: number }>()

    if (historicSessions && historicSessions.length > 0) {
      const sessionIds = historicSessions.map((s: any) => s.id)

      // Map session_id -> week
      const sessionWeekMap: Record<string, string> = {}
      for (const s of historicSessions) {
        const d = new Date(s.session_date + 'T12:00:00Z')
        const dow = d.getUTCDay()
        const diff = dow === 0 ? -6 : 1 - dow
        const mon = new Date(d)
        mon.setUTCDate(d.getUTCDate() + diff)
        const wk = mon.toISOString().split('T')[0]
        sessionWeekMap[s.id] = wk
        if (!weekHistoryMap.has(wk)) weekHistoryMap.set(wk, { volume: 0, sessions: 0, prs: 0 })
        weekHistoryMap.get(wk)!.sessions++
      }

      const { data: seData } = await (admin as any)
        .from('session_exercises')
        .select('id, session_id')
        .in('session_id', sessionIds)

      if (seData && seData.length > 0) {
        const seIds = seData.map((se: any) => se.id)
        const seToSession: Record<string, string> = {}
        for (const se of seData) seToSession[se.id] = se.session_id

        const { data: setsData } = await (admin as any)
          .from('sets')
          .select('session_exercise_id, weight_kg, reps_completed, is_personal_record, set_type')
          .in('session_exercise_id', seIds)
          .eq('set_type', 'working')

        for (const s of (setsData || [])) {
          const sessionId = seToSession[s.session_exercise_id]
          const wk = sessionWeekMap[sessionId]
          if (!wk || !weekHistoryMap.has(wk)) continue
          const w = weekHistoryMap.get(wk)!
          w.volume += (Number(s.weight_kg) || 0) * (s.reps_completed || 0)
          if (s.is_personal_record) w.prs++
        }
      }
    }

    const weeks = Array.from(weekHistoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, data]) => {
        const d = new Date(weekStart + 'T12:00:00Z')
        const weekLabel = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })
        return {
          weekStart,
          weekLabel,
          volume: Math.round(data.volume),
          sessions: data.sessions,
          prs: data.prs
        }
      })

    return NextResponse.json({
      weekStart: weekStartStr,
      muscleVolume: result.sort((a, b) => b.setsThisWeek - a.setsThisWeek),
      weeks
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
