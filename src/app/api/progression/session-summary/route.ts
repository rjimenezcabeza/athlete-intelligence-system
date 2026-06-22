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
  return (await supa.auth.getUser()).data.user
}

function adminDb() {
  return createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: suggestions } = await (admin as any)
      .from('progression_log')
      .select('id, action_type, prev_weight_kg, new_weight_kg, new_reps_target, reasoning_es, reasoning_en, applied, exercises(name, muscle_group_primary)')
      .eq('athlete_id', profile.id)
      .eq('session_id', sessionId)
      .eq('applied', false)
      .order('created_at', { ascending: false })

    return NextResponse.json({ suggestions: suggestions ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
