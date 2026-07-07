import { getPendingSets, markSetSynced } from './db'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function syncPendingData(supabase: SupabaseClient) {
  const pending = await getPendingSets()
  if (!pending.length) return { synced: 0, errors: 0 }
  let synced = 0, errors = 0
  for (const p of pending) {
    try {
      const { error } = await supabase.from('sets').insert({
        session_exercise_id: p.sessionExerciseId,
        set_number: p.setData.setNumber,
        set_type: p.setData.setType,
        weight_kg: p.setData.weightKg,
        reps_completed: p.setData.repsCompleted,
        rir_actual: p.setData.rirActual ?? null,
        logged_at: new Date(p.timestamp).toISOString(),
      })
      if (!error) { await markSetSynced(p.tempId); synced++ } else errors++
    } catch { errors++ }
  }
  return { synced, errors }
}
