import type { SupabaseClient } from '@supabase/supabase-js'

export async function checkAndMarkPR(
  supabase: SupabaseClient,
  sessionExerciseId: string,
  exerciseId: string,
  athleteId: string,
  weightKg: number,
  repsCompleted: number
): Promise<boolean> {
  void exerciseId
  void athleteId

  const { data: previousBest } = await supabase
    .from('sets')
    .select('weight_kg, reps_completed')
    .eq('set_type', 'working')
    .eq('is_personal_record', false)
    .gt('weight_kg', 0)
    .order('weight_kg', { ascending: false })
    .limit(1)

  const isPR = !previousBest?.length || weightKg > (previousBest[0].weight_kg ?? 0)

  if (isPR) {
    await supabase
      .from('sets')
      .update({ is_personal_record: true })
      .eq('session_exercise_id', sessionExerciseId)
      .eq('set_number', repsCompleted)
  }

  return isPR
}
