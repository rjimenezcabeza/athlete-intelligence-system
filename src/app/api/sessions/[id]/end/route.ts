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
    const admin = db()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    const { data: session } = await (admin as any)
      .from('training_sessions')
      .select('id, started_at, athlete_id')
      .eq('id', sessionId).eq('athlete_id', profile.id).single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const endedAt = new Date()
    // Si started_at es null (bug conocido), usar created_at o 45min por defecto
    const startedAt = session.started_at ? new Date(session.started_at) : new Date(endedAt.getTime() - 45 * 60000)
    const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))

    await (admin as any).from('training_sessions').update({
      status: 'feedback_pending',
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes
    }).eq('id', sessionId)

    return NextResponse.json({ success: true, redirect_to: 'feedback', durationMinutes })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
