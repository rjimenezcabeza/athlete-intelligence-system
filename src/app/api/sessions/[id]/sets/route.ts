import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function db() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
async function getUser() {
  const store = await cookies()
  const s = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll() { return store.getAll() }, setAll() {} } }
  )
  return (await s.auth.getUser()).data.user
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: sessionId } = await params
    const body = await req.json()
    const { session_exercise_id, set_number, set_type, weight_kg, reps_completed, rir_actual, notes } = body
    if (!session_exercise_id || !set_number) {
      return NextResponse.json({ error: 'session_exercise_id y set_number requeridos' }, { status: 400 })
    }
    const admin = db()

    // Verify session ownership
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    const { data: session } = await (admin as any)
      .from('training_sessions').select('id').eq('id', sessionId).eq('athlete_id', profile.id).maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const { data: setData, error } = await (admin as any)
      .from('sets')
      .insert({
        session_exercise_id,
        set_number,
        set_type: set_type ?? 'working',
        weight_kg: weight_kg ?? null,
        reps_completed: reps_completed ?? null,
        rir_actual: rir_actual ?? null,
        notes: notes ?? null,
        logged_at: new Date().toISOString()
      })
      .select('id, set_number, weight_kg, reps_completed, rir_actual, logged_at')
      .single()
    if (error) throw error
    return NextResponse.json({ set: setData })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { setId } = await req.json()
    if (!setId) return NextResponse.json({ error: 'setId requerido' }, { status: 400 })
    const admin = db()
    await (admin as any).from('sets').delete().eq('id', setId)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
