import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/memory/history?exercise_id=xxx&limit=20
export async function GET(request: Request) {
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
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const url = new URL(request.url)
  const exercise_id = url.searchParams.get('exercise_id')
  const limit = parseInt(url.searchParams.get('limit') || '20')

  let query = (supabase as any)
    .from('exercise_history')
    .select(`
      *,
      exercises(id, name, slug, muscle_group_primary, equipment)
    `)
    .eq('athlete_id', profile.id)
    .order('last_logged_at', { ascending: false })
    .limit(limit)

  if (exercise_id) {
    query = query.eq('exercise_id', exercise_id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
