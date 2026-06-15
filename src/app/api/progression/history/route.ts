import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/progression/history?exercise_id=xxx&limit=10
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
  const exercise_id = url.searchParams.get('exercise_id')
  const limit = parseInt(url.searchParams.get('limit') || '10')

  let query = (supabase as any)
    .from('progression_log')
    .select(`
      *,
      exercises(id, name, slug)
    `)
    .eq('athlete_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (exercise_id) {
    query = query.eq('exercise_id', exercise_id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
