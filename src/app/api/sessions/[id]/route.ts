import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const getSvc = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(getUrl(), getSvc(), {
    cookies: { getAll() { return store.getAll() }, setAll() {} }
  })
  const { data: { user } } = await supa.auth.getUser()
  return user
}

function adminDb() {
  return createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: sessionId } = await params
    const admin = adminDb()

    // Resolve athlete_profiles.id
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Verify ownership
    const { data: session } = await (admin as any)
      .from('training_sessions')
      .select('id, athlete_id')
      .eq('id', sessionId)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.athlete_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Get all session_exercise IDs
    const { data: sessionExercises } = await (admin as any)
      .from('session_exercises')
      .select('id')
      .eq('session_id', sessionId)

    const seIds = (sessionExercises ?? []).map((se: any) => se.id)

    // Delete sets → session_exercises → session (cascade order)
    if (seIds.length > 0) {
      await (admin as any).from('sets').delete().in('session_exercise_id', seIds)
      await (admin as any).from('session_exercises').delete().eq('session_id', sessionId)
    }

    const { error } = await (admin as any)
      .from('training_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
