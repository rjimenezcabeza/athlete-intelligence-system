import { createServerSideClient } from '@/lib/supabase/server'
import { TemplateList } from '@/components/templates/TemplateList'

export const dynamic = 'force-dynamic'

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
    <div style={{minHeight:'100vh',background:'var(--bg-primary,#0A0A0F)',paddingBottom:100}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{padding:'52px 20px 20px',background:'linear-gradient(180deg,rgba(167,139,250,.07) 0%,transparent 100%)'}}>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,fontFamily:'Syne,sans-serif',color:'var(--text-primary,#fff)',letterSpacing:'-0.02em'}}>
          📋 Plantillas
        </h1>
        <p style={{margin:'6px 0 0',fontSize:12,color:'var(--text-tertiary,#44445a)',fontFamily:'DM Mono,monospace'}}>
          {(templates??[]).length} plantillas guardadas
        </p>
      </div>
      <div style={{padding:'0 16px',animation:'fadeUp .4s ease-out .1s both'}}>
        <TemplateList
          templates={templates ?? []}
          progressionMethods={progressionMethods ?? []}
        />
      </div>
    </div>
  )
}
