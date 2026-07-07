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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const admin = adminDb()

  const { data: profile } = await (admin as any).from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }

  const allowed = ['title','description','goal_type','target_value','current_value','unit','exercise_id','muscle_group','target_date','priority','emoji','status','progress_log']
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (body.status === 'completed' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString()
  }

  const { data: goal, error } = await (admin as any)
    .from('athlete_goals')
    .update(updates)
    .eq('id', id)
    .eq('athlete_id', profile.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ goal })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const admin = adminDb()

  const { data: profile } = await (admin as any).from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { error } = await (admin as any).from('athlete_goals').delete().eq('id', id).eq('athlete_id', profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
