import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

async function getUser() {
  const store = await cookies()
  const s = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll() { return store.getAll() }, setAll() {} } }
  )
  return (await s.auth.getUser()).data.user
}

function adminDb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = adminDb()

  const { data: profile } = await (admin as any).from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data: goals, error } = await (admin as any)
    .from('athlete_goals')
    .select('*, exercises(name, muscle_group_primary)')
    .eq('athlete_id', profile.id)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ goals })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = adminDb()

  const { data: profile } = await (admin as any).from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await req.json()
  const { title, description, goal_type, target_value, current_value, unit, exercise_id, muscle_group, target_date, priority, emoji } = body

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const { data: goal, error } = await (admin as any).from('athlete_goals').insert({
    athlete_id: profile.id,
    title, description, goal_type: goal_type || 'general',
    target_value, current_value, unit,
    exercise_id: exercise_id || null,
    muscle_group, target_date,
    priority: priority || 2,
    emoji: emoji || '🎯',
    status: 'active',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ goal })
}
