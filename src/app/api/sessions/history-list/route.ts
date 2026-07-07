import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const store = await cookies()
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const svc = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
    const supa = createServerClient(url, svc, {
      cookies: { getAll() { return store.getAll() }, setAll() {} }
    })
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = createClient(url, svc)
    const { data: profile } = await admin.from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ sessions: [] })
    const { data: sessions } = await admin.from('training_sessions')
      .select('id,session_date,duration_minutes,pump_rating,local_fatigue,perceived_recovery,status')
      .eq('athlete_id', profile.id)
      .order('session_date', { ascending: false })
      .limit(50)
    return NextResponse.json({ sessions: sessions ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
