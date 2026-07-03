import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ exercises: [] })
    const { id: sessionId } = await params
    const admin = db()

    // Verify session ownership
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ exercises: [] })

    const { data: session } = await (admin as any)
      .from('training_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .eq('athlete_id', profile.id)
      .maybeSingle()
    if (!session) return NextResponse.json({ exercises: [] })

    // Load session_exercises with exercise info
    const { data: sessionExercises } = await (admin as any)
      .from('session_exercises')
      .select('id, session_id, exercise_id, order_in_session, exercises(id, name, muscle_group_primary, slug)')
      .eq('session_id', sessionId)
      .order('order_in_session', { ascending: true })

    if (!sessionExercises || sessionExercises.length === 0) {
      return NextResponse.json({ exercises: [] })
    }

    // Load all sets for these session_exercises
    const seIds = sessionExercises.map((se: any) => se.id)
    const { data: allSets } = await (admin as any)
      .from('sets')
      .select('id, session_exercise_id, set_number, set_type, weight_kg, reps_completed, rir_actual, rpe_actual, notes, logged_at')
      .in('session_exercise_id', seIds)
      .order('set_number', { ascending: true })

    // Attach sets to each session_exercise
    const setsBySeId: Record<string, any[]> = {}
    for (const set of (allSets ?? [])) {
      if (!setsBySeId[set.session_exercise_id]) setsBySeId[set.session_exercise_id] = []
      setsBySeId[set.session_exercise_id].push(set)
    }

    const exercises = sessionExercises.map((se: any) => ({
      ...se,
      sets: setsBySeId[se.id] ?? []
    }))

    return NextResponse.json({ exercises })
  } catch (e) {
    return NextResponse.json({ exercises: [] })
  }
}
