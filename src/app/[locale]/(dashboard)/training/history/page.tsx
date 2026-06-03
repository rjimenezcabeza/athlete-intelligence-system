import { createServerSideClient } from '@/lib/supabase/server'
import { HistoryClient } from '@/components/training/HistoryClient'

export default async function HistoryPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('id, weight_unit')
    .eq('user_id', user!.id)
    .single()

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select(`
      id, session_date, day_label, duration_minutes,
      session_exercises(
        exercise:exercises(name, muscle_group_primary),
        sets(weight_kg, reps_completed, set_type, is_personal_record)
      )
    `)
    .eq('athlete_id', profile?.id ?? '')
    .order('session_date', { ascending: false })
    .order('started_at', { ascending: false })
    .limit(30)

  return <HistoryClient sessions={sessions ?? []} weightUnit={profile?.weight_unit ?? 'kg'} />
}
