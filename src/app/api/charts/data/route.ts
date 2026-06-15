import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/charts/data?type=volume|feedback&weeks=8
export async function GET(request: Request) {
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
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const url = new URL(request.url)
  const type = url.searchParams.get('type') || 'volume'
  const weeks = parseInt(url.searchParams.get('weeks') || '8')

  const since = new Date()
  since.setDate(since.getDate() - weeks * 7)

  if (type === 'volume') {
    const { data: sessions } = await (supabase as any)
      .from('training_sessions')
      .select(`
        session_date,
        session_exercises(
          sets(weight_kg, reps_completed, set_type)
        )
      `)
      .eq('athlete_id', profile.id)
      .eq('status', 'completed')
      .gte('session_date', since.toISOString().split('T')[0])
      .order('session_date')

    const weeklyData: Record<string, { volume: number; sessions: number }> = {}

    if (sessions) {
      for (const session of sessions) {
        const date = new Date(session.session_date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay() + 1)
        const weekKey = weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

        if (!weeklyData[weekKey]) weeklyData[weekKey] = { volume: 0, sessions: 0 }
        weeklyData[weekKey].sessions += 1

        for (const se of (session.session_exercises || [])) {
          for (const set of (se.sets || [])) {
            if (set.set_type === 'working' && set.weight_kg && set.reps_completed) {
              weeklyData[weekKey].volume += set.weight_kg * set.reps_completed
            }
          }
        }
      }
    }

    const chartData = Object.entries(weeklyData).map(([date, d]) => ({
      date,
      volume: Math.round(d.volume),
      sessions: d.sessions
    }))

    return NextResponse.json({ data: chartData, type: 'volume' })
  }

  if (type === 'feedback') {
    const { data: sessions } = await (supabase as any)
      .from('training_sessions')
      .select('session_date, pump_rating, local_fatigue, perceived_recovery')
      .eq('athlete_id', profile.id)
      .eq('status', 'completed')
      .gte('session_date', since.toISOString().split('T')[0])
      .not('feedback_completed_at', 'is', null)
      .order('session_date')

    const chartData = (sessions || []).map((s: any) => ({
      date: new Date(s.session_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      pump: s.pump_rating,
      fatigue: s.local_fatigue,
      recovery: s.perceived_recovery
    }))

    return NextResponse.json({ data: chartData, type: 'feedback' })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
