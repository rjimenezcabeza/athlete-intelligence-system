import { createServerSideClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('athlete_profiles').select('*').eq('user_id', user!.id).single()

  const { data: activeTemplate } = await supabase
    .from('training_templates')
    .select('id, name, training_days_per_week')
    .eq('athlete_id', profile?.id ?? '')
    .eq('is_active', true)
    .eq('is_archived', false)
    .limit(1)
    .single()

  return (
    <DashboardClient
      displayName={profile?.display_name ?? 'Atleta'}
      nextTemplate={activeTemplate ?? null}
    />
  )
}
