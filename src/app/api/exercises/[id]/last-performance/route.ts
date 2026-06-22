import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseId } = await params
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Últimas 20 sesiones completadas (orden desc por fecha)
    const { data: sessions } = await (admin as any)
      .from('training_sessions')
      .select('id, session_date')
      .eq('athlete_id', profile.id)
      .eq('status', 'completed')
      .order('session_date', { ascending: false })
      .limit(20)

    const sessionIds = (sessions ?? []).map((s: any) => s.id)
    if (sessionIds.length === 0) return NextResponse.json({ lastPerformance: null })

    // Todos los session_exercises de este ejercicio en esas sesiones
    const { data: occurrences } = await (admin as any)
      .from('session_exercises')
      .select('id, session_id')
      .eq('exercise_id', exerciseId)
      .in('session_id', sessionIds)

    if (!occurrences || occurrences.length === 0) {
      return NextResponse.json({ lastPerformance: null })
    }

    // Encontrar la sesión más reciente que contiene este ejercicio
    let lastSEId: string | null = null
    let lastSessionId: string | null = null
    for (const sid of sessionIds) {
      const found = occurrences.find((se: any) => se.session_id === sid)
      if (found) { lastSEId = found.id; lastSessionId = sid; break }
    }

    if (!lastSEId) return NextResponse.json({ lastPerformance: null })

    const sessionDate = sessions?.find((s: any) => s.id === lastSessionId)?.session_date

    // Sets de esa sesión
    const { data: sets } = await (admin as any)
      .from('sets')
      .select('set_number, weight_kg, reps_completed, rir_actual, set_type')
      .eq('session_exercise_id', lastSEId)
      .order('set_number')

    const workingSets = (sets ?? []).filter((s: any) => s.set_type === 'working' && s.weight_kg)
    const formattedSets = (sets ?? [])
      .filter((s: any) => s.set_type === 'working')
      .map((s: any) => ({
        setNumber: s.set_number,
        weightKg: s.weight_kg,
        repsCompleted: s.reps_completed,
        rirActual: s.rir_actual
      }))

    const avgWeight = workingSets.length > 0
      ? workingSets.reduce((sum: number, s: any) => sum + Number(s.weight_kg), 0) / workingSets.length
      : null
    const maxWeight = workingSets.length > 0
      ? Math.max(...workingSets.map((s: any) => Number(s.weight_kg)))
      : null
    const avgRir = workingSets.filter((s: any) => s.rir_actual !== null).length > 0
      ? workingSets.reduce((sum: number, s: any) => sum + (s.rir_actual ?? 0), 0) / workingSets.length
      : null

    // Historial del ejercicio para tendencia
    const { data: history } = await (admin as any)
      .from('exercise_history')
      .select('best_weight_kg, avg_weight_last4w, weight_trend, best_1rm_estimated, total_sessions')
      .eq('athlete_id', profile.id)
      .eq('exercise_id', exerciseId)
      .single()

    return NextResponse.json({
      lastPerformance: {
        sets: formattedSets,
        sessionDate,
        summary: { totalSets: formattedSets.length, avgWeight, maxWeight, avgRir },
        history: history ? {
          bestWeightKg: history.best_weight_kg,
          avgWeightLast4w: history.avg_weight_last4w,
          weightTrend: history.weight_trend,
          best1rmEstimated: history.best_1rm_estimated,
          totalSessions: history.total_sessions
        } : null
      }
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
