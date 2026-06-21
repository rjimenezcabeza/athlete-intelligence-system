import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('display_name, primary_goal, training_experience_years, body_weight_kg, height_cm, subscription_tier, weight_unit, language')
      .eq('user_id', user.id).single()
    return NextResponse.json({ profile })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { display_name, primary_goal, training_experience_years, body_weight_kg, height_cm, weight_unit, language } = body
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (display_name !== undefined) updates.display_name = display_name
    if (primary_goal !== undefined) updates.primary_goal = primary_goal
    if (training_experience_years !== undefined) updates.training_experience_years = training_experience_years
    if (body_weight_kg !== undefined) updates.body_weight_kg = body_weight_kg ? parseFloat(body_weight_kg) : null
    if (height_cm !== undefined) updates.height_cm = height_cm ? parseFloat(height_cm) : null
    if (weight_unit !== undefined) updates.weight_unit = weight_unit
    if (language !== undefined) updates.language = language
    const admin = createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
    const { error } = await (admin as any).from('athlete_profiles').update(updates).eq('user_id', user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
