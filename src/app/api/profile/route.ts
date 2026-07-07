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

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = createClient(getUrl(), getSvcKey())
    const { data: profile, error } = await admin
      .from('athlete_profiles')
      .select('id, display_name, primary_goal, training_experience_years, body_weight_kg, subscription_tier')
      .eq('user_id', user.id)
      .single()
    if (error || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    return NextResponse.json({ profile })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const admin = createClient(getUrl(), getSvcKey())
    const { data, error } = await admin
      .from('athlete_profiles')
      .update({
        display_name: body.display_name,
        primary_goal: body.primary_goal,
        training_experience_years: body.training_experience_years,
        body_weight_kg: body.body_weight_kg,
      })
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
