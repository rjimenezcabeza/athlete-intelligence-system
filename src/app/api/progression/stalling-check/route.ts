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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: stallingData } = await (supabase as any)
      .from('progression_log')
      .select(`
        exercise_id,
        action_type,
        created_at,
        exercises(name, muscle_group_primary)
      `)
      .eq('athlete_id', profile.id)
      .eq('action_type', 'maintain_weight')
      .order('created_at', { ascending: false })
      .limit(50)

    const exerciseMap: Record<string, { name: string; muscle: string; count: number; lastDate: string }> = {}
    for (const log of (stallingData || [])) {
      const eid = log.exercise_id
      if (!exerciseMap[eid]) {
        exerciseMap[eid] = {
          name: log.exercises?.name || 'Ejercicio',
          muscle: log.exercises?.muscle_group_primary || '',
          count: 0,
          lastDate: log.created_at
        }
      }
      exerciseMap[eid].count++
    }

    const stallingExercises = Object.entries(exerciseMap)
      .filter(([, data]) => data.count >= 2)
      .map(([exerciseId, data]) => ({ exerciseId, ...data }))

    const { data: activeMeso } = await (supabase as any)
      .from('mesocycles')
      .select('id, name, current_week, total_weeks, deload_week')
      .eq('athlete_id', profile.id)
      .eq('status', 'active')
      .maybeSingle()

    const deloadRecommended = stallingExercises.length >= 3 ||
      (activeMeso && activeMeso.current_week >= activeMeso.total_weeks - 1)

    const nearingMesoEnd = activeMeso &&
      activeMeso.current_week >= activeMeso.total_weeks - 1

    return NextResponse.json({
      stallingExercises,
      deloadRecommended,
      nearingMesoEnd,
      activeMesocycle: activeMeso ? {
        name: activeMeso.name,
        currentWeek: activeMeso.current_week,
        totalWeeks: activeMeso.total_weeks
      } : null
    })
  } catch (error) {
    console.error('[stalling-check]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
