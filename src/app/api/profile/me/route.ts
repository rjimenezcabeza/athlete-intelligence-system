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
      .select('display_name, primary_goal, training_experience_years, body_weight_kg, height_cm, subscription_tier, weight_unit, language, accent_color, ui_theme, notification_workout_reminders, notification_progression_alerts, notification_coach_insights, notification_weekly_summary, nutrition_calories_target, nutrition_protein_g, nutrition_carbs_g, nutrition_fat_g, nutrition_meals_per_day, training_split_detected')
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
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const allowed = [
      'display_name', 'primary_goal', 'training_experience_years',
      'body_weight_kg', 'height_cm', 'weight_unit', 'language',
      'accent_color', 'ui_theme',
      'notification_workout_reminders', 'notification_progression_alerts',
      'notification_coach_insights', 'notification_weekly_summary',
      'nutrition_calories_target', 'nutrition_protein_g', 'nutrition_carbs_g',
      'nutrition_fat_g', 'nutrition_meals_per_day', 'nutrition_notes'
    ]
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'body_weight_kg' || key === 'height_cm') {
          updates[key] = body[key] ? parseFloat(body[key]) : null
        } else {
          updates[key] = body[key]
        }
      }
    }
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
