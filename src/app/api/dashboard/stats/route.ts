import { createServerSideClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getWeekStart } from '@/lib/utils/training'

export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const weekStart = getWeekStart()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]

  const { data: weekSessions } = await supabase
    .from('training_sessions')
    .select('id, session_date, session_exercises(sets(weight_kg, reps_completed, set_type))')
    .eq('athlete_id', profile.id)
    .gte('session_date', weekStart)

  const { data: monthPRs } = await supabase
    .from('sets')
    .select('id, weight_kg, reps_completed, logged_at, session_exercise:session_exercises!inner(exercise:exercises(name), session:training_sessions!inner(athlete_id, session_date))')
    .eq('is_personal_record', true)
    .eq('session_exercise.session.athlete_id', profile.id)
    .gte('session_exercise.session.session_date', monthStart)
    .order('logged_at', { ascending: false })
    .limit(5)

  const { data: recentSessions } = await supabase
    .from('training_sessions')
    .select('session_date')
    .eq('athlete_id', profile.id)
    .order('session_date', { ascending: false })
    .limit(60)

  let streak = 0
  if (recentSessions?.length) {
    const today = new Date().toISOString().split('T')[0]
    const dates = [...new Set(recentSessions.map(s => s.session_date))].sort().reverse()
    let expected = today
    for (const date of dates) {
      if (date === expected) {
        streak++
        const d = new Date(expected)
        d.setDate(d.getDate() - 1)
        expected = d.toISOString().split('T')[0]
      } else break
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weekVolume = (weekSessions ?? []).reduce((total, s) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    total + (s.session_exercises ?? []).reduce((exTotal: number, ex: any) =>
      exTotal + (ex.sets ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((set: any) => set.set_type === 'working')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce((setTotal: number, set: any) =>
          setTotal + (set.weight_kg ?? 0) * (set.reps_completed ?? 0), 0
        ), 0
    ), 0
  )

  return NextResponse.json({
    weekSessions: weekSessions?.length ?? 0,
    weekVolume: Math.round(weekVolume),
    streak,
    monthPRs: monthPRs?.length ?? 0,
    recentPRs: monthPRs ?? [],
  })
}
