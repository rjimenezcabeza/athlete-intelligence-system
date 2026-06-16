import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const exerciseId = searchParams.get('exerciseId')
  if (!exerciseId) return NextResponse.json({ sets: [] })

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles').select('id').eq('user_id', user.id).single()

  if (!profile) return NextResponse.json({ sets: [] })

  // Últimas series de trabajo de este ejercicio para este atleta
  const { data: sets } = await (supabase as any)
    .from('sets')
    .select(`
      weight_kg, reps_completed, rir_actual, set_type, logged_at,
      session_exercises!inner (
        exercise_id,
        training_sessions!inner ( athlete_id, session_date )
      )
    `)
    .eq('session_exercises.exercise_id', exerciseId)
    .eq('session_exercises.training_sessions.athlete_id', profile.id)
    .eq('set_type', 'working')
    .order('logged_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ sets: sets ?? [] })
}
