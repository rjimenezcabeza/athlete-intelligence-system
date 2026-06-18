import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

function db() { return createClient(getUrl(), getSvcKey()) }

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, exerciseId } = await req.json()
    if (!sessionId || !exerciseId) {
      return NextResponse.json({ error: 'sessionId and exerciseId required' }, { status: 400 })
    }

    const admin = db()

    // Verify session belongs to user's athlete profile
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: session } = await (admin as any)
      .from('training_sessions').select('id').eq('id', sessionId).eq('athlete_id', profile.id).single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Get exercise data
    const { data: exercise } = await (admin as any)
      .from('exercises').select('id, name, name_en, muscle_group_primary, slug').eq('id', exerciseId).single()
    if (!exercise) return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })

    // Get next order_index
    const { data: existing } = await (admin as any)
      .from('session_exercises').select('order_index').eq('session_id', sessionId).order('order_index', { ascending: false }).limit(1)
    const nextIndex = existing && existing.length > 0 ? (existing[0].order_index ?? 0) + 1 : 1

    // Insert session_exercise
    const { data: sessionExercise, error } = await (admin as any)
      .from('session_exercises')
      .insert({ session_id: sessionId, exercise_id: exerciseId, order_index: nextIndex })
      .select('id').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      session_exercise_id: sessionExercise.id,
      exercise
    }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
