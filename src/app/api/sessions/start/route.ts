import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = db()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Return existing active session instead of creating duplicates
    const { data: existing } = await (admin as any)
      .from('training_sessions')
      .select('id, session_date, status, started_at, athlete_id')
      .eq('athlete_id', profile.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing) return NextResponse.json({ session: existing })

    const body = await request.json().catch(() => ({}))
    const now = new Date().toISOString()
    const insertData: Record<string, unknown> = {
      athlete_id: profile.id,
      session_date: body.session_date ?? now.split('T')[0],
      status: 'active',
      started_at: now,
    }
    if (body.readiness_score != null) insertData.readiness_score = Number(body.readiness_score)
    if (body.sleep_quality != null) insertData.sleep_quality = Number(body.sleep_quality)
    if (body.stress_level != null) insertData.stress_level = Number(body.stress_level)
    if (body.notes) insertData.notes = String(body.notes)
    if (body.body_weight_kg != null) insertData.body_weight_kg = Number(body.body_weight_kg)
    if (body.templateId) insertData.template_id = String(body.templateId)
    if (body.dayNumber != null) insertData.day_number = Number(body.dayNumber)
    if (body.dayLabel) insertData.day_label = String(body.dayLabel)

    const { data: session, error } = await (admin as any)
      .from('training_sessions')
      .insert(insertData)
      .select('id, session_date, status, started_at, athlete_id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
