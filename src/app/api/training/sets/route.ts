import { createServerSideClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const sets = Array.isArray(body) ? body : [body]

  const results = []
  for (const set of sets) {
    const { data, error } = await supabase.from('sets').insert({
      session_exercise_id: set.sessionExerciseId,
      set_number: set.setNumber,
      set_type: set.setType ?? 'working',
      weight_kg: set.weightKg,
      reps_completed: set.repsCompleted,
      rir_actual: set.rirActual ?? null,
      notes: set.notes ?? null,
      logged_at: set.loggedAt ?? new Date().toISOString(),
    }).select().single()

    if (!error) results.push(data)
  }

  return NextResponse.json(results, { status: 201 })
}
