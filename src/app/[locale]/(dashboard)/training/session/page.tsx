import { createServerSideClient } from '@/lib/supabase/server'
import { SessionView } from '@/components/training/SessionView'

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>
}) {
  const { templateId } = await searchParams
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('athlete_profiles').select('id, weight_unit').eq('user_id', user!.id).single()

  let template = null
  if (templateId) {
    const { data } = await supabase
      .from('training_templates')
      .select(`*, template_exercises(*, exercise:exercises(*), progression_method:progression_methods(*))`)
      .eq('id', templateId)
      .single()
    template = data
  }

  const { data: templates } = await supabase
    .from('training_templates')
    .select('id, name, training_days_per_week')
    .eq('athlete_id', profile?.id ?? '')
    .eq('is_archived', false)
    .eq('is_active', true)

  return (
    <SessionView
      athleteId={profile?.id ?? ''}
      weightUnit={profile?.weight_unit ?? 'kg'}
      initialTemplate={template}
      availableTemplates={templates ?? []}
    />
  )
}
