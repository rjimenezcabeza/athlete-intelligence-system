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

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = adminDb()

  const { data: profile } = await (admin as any).from('athlete_profiles').select('id, body_weight_kg, height_cm').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data: history } = await (admin as any)
    .from('body_metrics_history')
    .select('*')
    .eq('athlete_id', profile.id)
    .order('recorded_date', { ascending: false })
    .limit(90)

  return NextResponse.json({ history: history || [], profile_weight: profile.body_weight_kg, profile_height: profile.height_cm })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = adminDb()

  const { data: profile } = await (admin as any).from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await req.json()
  const {
    recorded_date, body_weight_kg, body_fat_pct, muscle_mass_kg, lean_mass_kg,
    water_pct, bone_mass_kg, visceral_fat, bmi,
    neck_cm, chest_cm, waist_cm, hips_cm,
    left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm,
    left_calf_cm, right_calf_cm, notes
  } = body

  const computedBmi = body_weight_kg && profile.height_cm
    ? Math.round((body_weight_kg / ((profile.height_cm / 100) ** 2)) * 10) / 10
    : bmi

  const { data: metric, error } = await (admin as any)
    .from('body_metrics_history')
    .upsert({
      athlete_id: profile.id,
      recorded_date: recorded_date || new Date().toISOString().split('T')[0],
      body_weight_kg, body_fat_pct, muscle_mass_kg, lean_mass_kg,
      water_pct, bone_mass_kg, visceral_fat, bmi: computedBmi,
      neck_cm, chest_cm, waist_cm, hips_cm,
      left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm,
      left_calf_cm, right_calf_cm, notes,
    }, { onConflict: 'athlete_id,recorded_date' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also update profile body_weight_kg if weight provided and it's today
  if (body_weight_kg) {
    await (admin as any).from('athlete_profiles').update({ body_weight_kg, updated_at: new Date().toISOString() }).eq('id', profile.id)
  }

  return NextResponse.json({ metric })
}
