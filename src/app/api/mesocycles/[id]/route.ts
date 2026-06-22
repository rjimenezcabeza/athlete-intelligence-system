import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getSupabaseAndProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  return { supabase, user, profile }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { supabase, user, profile } = await getSupabaseAndProfile()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const allowed = ['name', 'goal', 'status', 'notes', 'deload_week', 'ended_at']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }
    if (body.status === 'completed' && !updates.ended_at) {
      updates.ended_at = new Date().toISOString().split('T')[0]
    }

    const { data, error } = await (supabase as any)
      .from('mesocycles')
      .update(updates)
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ mesocycle: data })
  } catch (error) {
    console.error('[mesocycles PATCH]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, user, profile } = await getSupabaseAndProfile()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    await (supabase as any)
      .from('mesocycles')
      .delete()
      .eq('id', id)
      .eq('athlete_id', profile.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[mesocycles DELETE]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
