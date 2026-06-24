import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .select('id, weight_unit')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: session } = await (supabase as any)
      .from('training_sessions')
      .select('id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, notes, body_weight_kg, status')
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const { data: sessionExercises } = await (supabase as any)
      .from('session_exercises')
      .select('id, order_in_session, exercises(id, name, muscle_group_primary)')
      .eq('session_id', id)
      .order('order_in_session', { ascending: true })

    const exercises = []
    let totalSets = 0
    let totalVolume = 0

    for (const se of (sessionExercises || [])) {
      const { data: sets } = await (supabase as any)
        .from('sets')
        .select('set_number, set_type, weight_kg, reps_completed, rir_actual, is_personal_record')
        .eq('session_exercise_id', se.id)
        .order('set_number', { ascending: true })

      const workingSets = (sets || []).filter((s: any) => s.set_type === 'working')
      const weights = workingSets.map((s: any) => Number(s.weight_kg || 0)).filter(Boolean)
      const maxWeight = weights.length > 0 ? Math.max(...weights) : null
      const avgWeight = weights.length > 0 ? weights.reduce((a: number, b: number) => a + b, 0) / weights.length : null
      const exVolume = workingSets.reduce((sum: number, s: any) => sum + (Number(s.weight_kg || 0) * (s.reps_completed || 0)), 0)

      totalSets += workingSets.length
      totalVolume += exVolume

      exercises.push({
        name: se.exercises?.name || 'Ejercicio',
        muscleGroup: se.exercises?.muscle_group_primary || '',
        sets: (sets || []).map((s: any) => ({
          setNumber: s.set_number,
          setType: s.set_type,
          weightKg: s.weight_kg ? Number(s.weight_kg) : null,
          repsCompleted: s.reps_completed,
          rirActual: s.rir_actual,
          isPR: s.is_personal_record || false
        })),
        totalVolume: Math.round(exVolume),
        avgWeight: avgWeight ? Math.round(avgWeight * 10) / 10 : null,
        maxWeight: maxWeight ? Math.round(maxWeight * 10) / 10 : null
      })
    }

    return NextResponse.json({
      session: {
        id: session.id,
        sessionDate: session.session_date,
        durationMinutes: session.duration_minutes,
        pumpRating: session.pump_rating,
        localFatigue: session.local_fatigue,
        perceivedRecovery: session.perceived_recovery,
        notes: session.notes,
        bodyWeightKg: session.body_weight_kg ? Number(session.body_weight_kg) : null,
        exercises,
        totalSets,
        totalVolume: Math.round(totalVolume)
      }
    })
  } catch (error) {
    console.error('[sessions/detail]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
