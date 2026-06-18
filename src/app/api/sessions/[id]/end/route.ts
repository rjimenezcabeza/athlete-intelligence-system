import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const getSvcKey = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(getUrl(), getSvcKey(), {
    cookies: { getAll() { return store.getAll() }, setAll() {} }
  })
  const { data: { user } } = await supa.auth.getUser()
  return user
}

function db() { return createClient(getUrl(), getSvcKey()) }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Get the session to calculate duration
    const { data: sessionRow } = await (db() as any).from('training_sessions')
      .select('started_at, athlete_id').eq('id', id).single()

    if (!sessionRow) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // 2. Verify ownership
    const { data: profile } = await (db() as any).from('athlete_profiles')
      .select('id').eq('user_id', user!.id).single()
    if (!profile || sessionRow.athlete_id !== profile.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 3. Calculate duration
    const startedAt = sessionRow.started_at ? new Date(sessionRow.started_at) : null
    const now = new Date()
    const duration_minutes = startedAt ? Math.round((now.getTime() - startedAt.getTime()) / 60000) : 0

    // 4. Update status to feedback_pending
    const { error } = await (db() as any).from('training_sessions').update({
      status: 'feedback_pending',
      ended_at: now.toISOString(),
      duration_minutes,
      pump_rating: null, local_fatigue: null,
      perceived_recovery: null, rir_session_avg: null,
    }).eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ redirect_to: 'feedback' })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
