import { createServerSideClient } from '@/lib/supabase/server'
import { TemplateList } from '@/components/templates/TemplateList'

export default async function TemplatesPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('athlete_profiles').select('id').eq('user_id', user!.id).single()
  const { data: templates } = await supabase
    .from('training_templates')
    .select(`*, template_exercises(*, exercise:exercises(id, name, muscle_group_primary))`)
    .eq('athlete_id', profile?.id ?? '')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
  const { data: progressionMethods } = await supabase
    .from('progression_methods').select('*').order('name')

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Plantillas</h1>
      <TemplateList
        templates={templates ?? []}
        progressionMethods={progressionMethods ?? []}
      />
    </div>
  )
}
