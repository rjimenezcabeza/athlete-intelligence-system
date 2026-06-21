import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function adminDb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll() { return store.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supa.auth.getUser()
  return user
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, exerciseId } = await req.json()
    if (!sessionId || !exerciseId) {
      return NextResponse.json({ error: 'sessionId y exerciseId requeridos' }, { status: 400 })
    }

    const admin = adminDb()

    // Verificar que la sesion pertenece al usuario
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: session } = await (admin as any)
      .from('training_sessions')
      .select('id').eq('id', sessionId).eq('athlete_id', profile.id).single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Obtener datos del ejercicio
    const { data: exercise } = await (admin as any)
      .from('exercises')
      .select('id, name, muscle_group_primary, slug')
      .eq('id', exerciseId).single()
    if (!exercise) return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })

    // Obtener orden actual
    const { count } = await (admin as any)
      .from('session_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    const { data: sessionExercise, error: seError } = await (admin as any)
      .from('session_exercises')
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        order_in_session: (count ?? 0) + 1
      })
      .select('id').single()

    if (seError) throw seError

    return NextResponse.json({
      sessionExercise: {
        id: sessionExercise.id,
        exerciseId: exercise.id,
        name: exercise.name,
        muscle_group_primary: exercise.muscle_group_primary,
        slug: exercise.slug,
        order_in_session: (count ?? 0) + 1
      }
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
