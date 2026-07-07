import { createServerSideClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') ?? '20')
  const offset = parseInt(url.searchParams.get('offset') ?? '0')

  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      id, session_date, day_label, day_number, duration_minutes,
      started_at, ended_at, performance_rating, notes, source,
      session_exercises(
        id, order_in_session,
        exercise:exercises(id, name, muscle_group_primary),
        sets(id, set_number, set_type, weight_kg, reps_completed, rir_actual, is_personal_record, logged_at)
      )
    `)
    .eq('athlete_id', profile.id)
    .order('session_date', { ascending: false })
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
