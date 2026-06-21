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

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const exerciseId = req.nextUrl.searchParams.get('id')
    if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 })

    const admin = db()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Get last 12 sessions with this exercise and max weight per session
    const { data: sessionExercises } = await (admin as any)
      .from('session_exercises')
      .select('id, session_id, training_sessions(session_date, athlete_id)')
      .eq('exercise_id', exerciseId)
      .order('session_id', { ascending: false })
      .limit(20)

    const filtered = (sessionExercises ?? [])
      .filter((se: any) => se.training_sessions?.athlete_id === profile.id)
      .slice(0, 12)

    if (filtered.length === 0) return NextResponse.json({ data: [] })

    const seIds = filtered.map((se: any) => se.id)
    const { data: sets } = await (admin as any)
      .from('sets')
      .select('session_exercise_id, weight_kg, reps_completed')
      .in('session_exercise_id', seIds)
      .not('weight_kg', 'is', null)

    // Max weight per session_exercise
    const maxBySeId: Record<string, number> = {}
    for (const s of sets ?? []) {
      if (s.weight_kg > (maxBySeId[s.session_exercise_id] ?? 0)) {
        maxBySeId[s.session_exercise_id] = s.weight_kg
      }
    }

    const result = filtered
      .map((se: any) => ({
        date: se.training_sessions?.session_date ?? '',
        maxWeight: maxBySeId[se.id] ?? null
      }))
      .filter((d: any) => d.maxWeight !== null)
      .reverse()

    return NextResponse.json({ data: result })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
