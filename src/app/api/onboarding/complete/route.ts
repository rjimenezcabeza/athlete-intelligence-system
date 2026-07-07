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

function db() {
  return createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { display_name, training_experience_years, primary_goal, body_weight_kg, weight_unit, language } = await req.json()
    if (!display_name || display_name.trim().length < 2) {
      return NextResponse.json({ error: 'display_name required (min 2 chars)' }, { status: 400 })
    }

    const admin = db()
    const { data, error } = await (admin as any)
      .from('athlete_profiles')
      .upsert({
        user_id: user.id,
        display_name: display_name.trim(),
        training_experience_years: training_experience_years ? parseInt(training_experience_years) : null,
        primary_goal: primary_goal ?? 'hypertrophy',
        body_weight_kg: body_weight_kg ? parseFloat(body_weight_kg) : null,
        weight_unit: weight_unit ?? 'kg',
        language: language ?? 'es',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select().single()

    if (error) throw error
    return NextResponse.json({ success: true, profile: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
