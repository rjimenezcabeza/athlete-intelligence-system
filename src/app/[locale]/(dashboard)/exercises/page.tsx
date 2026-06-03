import { createServerSideClient } from '@/lib/supabase/server'
import { ExerciseList } from '@/components/exercises/ExerciseList'
export default async function ExercisesPage() {
  const supabase = await createServerSideClient()
  const { data: exercises } = await supabase.from('exercises').select('*').eq('is_global', true).order('muscle_group_primary').order('name')
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Ejercicios</h1>
      <ExerciseList exercises={exercises ?? []} />
    </div>
  )
}
