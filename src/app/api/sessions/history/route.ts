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
    const { data: profile } = await (admin as any).from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    const { data } = await (admin as any)
      .from('training_sessions')
      .select(`
        id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, status, day_label,
        session_exercises ( sets ( weight_kg, reps_completed ) )
      `)
      .eq('athlete_id', profile.id)
      .order('session_date', { ascending: false })
      .limit(100)

    // Compute volume per session and strip the nested structure
    const sessions = (data ?? []).map((s: any) => {
      const volume = (s.session_exercises ?? []).reduce((sum: number, se: any) =>
        sum + (se.sets ?? []).reduce((sv: number, set: any) =>
          sv + ((set.weight_kg ?? 0) * (set.reps_completed ?? 0)), 0), 0)
      const { session_exercises: _, ...rest } = s
      return { ...rest, volume_kg: Math.round(volume) }
    })

    return NextResponse.json({ sessions })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
