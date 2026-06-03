import { createServerSideClient } from '@/lib/supabase/server'
import { calculateProgression } from '@/lib/progression/engine'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { templateExerciseId, exerciseId, athleteId } = body

  const { data: te } = await supabase
    .from('template_exercises')
    .select('*, progression_method:progression_methods(*)')
    .eq('id', templateExerciseId)
    .single()

  if (!te) return NextResponse.json({ error: 'Template exercise not found' }, { status: 404 })

  const { data: history } = await supabase
    .from('training_sessions')
    .select(`session_date, session_exercises!inner(sets(*))`)
    .eq('athlete_id', athleteId)
    .eq('session_exercises.exercise_id', exerciseId)
    .order('session_date', { ascending: false })
    .limit(5)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exerciseHistory = (history ?? []).map((s: any) => ({
    sessionDate: s.session_date,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sets: s.session_exercises.flatMap((se: any) => se.sets.map((set: any) => ({
      weightKg: set.weight_kg,
      repsCompleted: set.reps_completed,
      rirActual: set.rir_actual,
      setType: set.set_type,
    }))),
  }))

  const rawConfig = (te.progression_method as { config?: unknown } | null)?.config
  const methodConfig = (rawConfig as Parameters<typeof calculateProgression>[0]['config'] | undefined) ?? {
    repRangeMin: te.rep_range_min ?? 8,
    repRangeMax: te.rep_range_max ?? 12,
    sets: te.sets_target ?? 3,
    weightIncrementKg: 2.5,
    restSeconds: te.rest_seconds ?? 120,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastWeight = exerciseHistory[0]?.sets.filter((s: any) => s.setType === 'working').at(-1)?.weightKg ?? 0

  const result = calculateProgression({
    methodType: (te.progression_method as { method_type?: string } | null)?.method_type as Parameters<typeof calculateProgression>[0]['methodType'] ?? 'double_progression',
    config: methodConfig,
    exerciseHistory,
    currentPrescription: {
      setsTarget: te.sets_target ?? 3,
      repRangeMin: te.rep_range_min ?? 8,
      repRangeMax: te.rep_range_max ?? 12,
      rirTarget: te.rir_target ?? undefined,
      currentWeightKg: lastWeight,
    },
  })

  await supabase.from('ai_recommendations').insert({
    athlete_id: athleteId,
    template_exercise_id: templateExerciseId,
    recommendation_type: 'progression',
    recommendation_text: result.reasoning,
    reasoning: result.reasoning,
    context_data: JSON.parse(JSON.stringify({ result, exerciseHistoryCount: exerciseHistory.length })),
    ai_model: 'progression-engine-v1',
    ai_provider: 'internal',
  })

  return NextResponse.json(result)
}
