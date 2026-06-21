import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const getSvc = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

async function getUser() {
  const store = await cookies()
  const s = createServerClient(getUrl(), getSvc(), {
    cookies: { getAll() { return store.getAll() }, setAll() {} }
  })
  const { data: { user } } = await s.auth.getUser()
  return user
}

function adminDb() {
  return createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
}

// GET /api/daily-log — returns last 7 daily logs for the athlete
export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ logs: [] })

    const since = new Date()
    since.setDate(since.getDate() - 7)

    const { data: rows } = await (admin as any)
      .from('training_sessions')
      .select('id, session_date, body_weight_kg, readiness_score, sleep_quality, stress_level, notes')
      .eq('athlete_id', profile.id)
      .eq('status', 'daily_log')
      .gte('session_date', since.toISOString().split('T')[0])
      .order('session_date', { ascending: false })

    return NextResponse.json({ logs: (rows ?? []).map((r: any) => ({
      id: r.id,
      date: r.session_date,
      weight: r.body_weight_kg,
      energy: r.readiness_score,
      sleep: r.sleep_quality,
      stress: r.stress_level,
      notes: r.notes,
    })) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

// POST /api/daily-log — upsert today's daily log
export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const today = new Date().toISOString().split('T')[0]

    // Check if today's log already exists
    const { data: existing } = await (admin as any)
      .from('training_sessions')
      .select('id')
      .eq('athlete_id', profile.id)
      .eq('status', 'daily_log')
      .eq('session_date', today)
      .single()

    const payload: Record<string, unknown> = {
      athlete_id: profile.id,
      session_date: today,
      status: 'daily_log',
      source: 'manual',
      updated_at: new Date().toISOString(),
    }
    if (body.weight !== undefined) payload.body_weight_kg = body.weight ? parseFloat(body.weight) : null
    if (body.energy !== undefined) payload.readiness_score = body.energy
    if (body.sleep !== undefined) payload.sleep_quality = body.sleep
    if (body.stress !== undefined) payload.stress_level = body.stress
    if (body.notes !== undefined) payload.notes = body.notes

    if (existing) {
      await (admin as any).from('training_sessions').update(payload).eq('id', existing.id)
    } else {
      payload.started_at = new Date().toISOString()
      await (admin as any).from('training_sessions').insert(payload)
    }

    // Also update current weight on profile if provided
    if (body.weight) {
      await (admin as any).from('athlete_profiles').update({
        body_weight_kg: parseFloat(body.weight),
        updated_at: new Date().toISOString()
      }).eq('id', profile.id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
