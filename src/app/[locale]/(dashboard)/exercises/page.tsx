import { createServerSideClient } from '@/lib/supabase/server'
import { ExerciseList } from '@/components/exercises/ExerciseList'

export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`is_global.eq.true${user ? `,created_by.eq.${user.id}` : ''}`)
    .order('muscle_group_primary')
    .order('name')
  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary,#0A0A0F)',paddingBottom:100}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{padding:'52px 20px 20px',background:'linear-gradient(180deg,rgba(74,222,128,.06) 0%,transparent 100%)'}}>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,fontFamily:'Syne,sans-serif',color:'var(--text-primary,#fff)',letterSpacing:'-0.02em'}}>
          💪 Ejercicios
        </h1>
        <p style={{margin:'6px 0 0',fontSize:12,color:'var(--text-tertiary,#44445a)',fontFamily:'DM Mono,monospace'}}>
          {(exercises??[]).length} ejercicios disponibles
        </p>
      </div>
      <div style={{padding:'0 16px',animation:'fadeUp .4s ease-out .1s both'}}>
        <ExerciseList exercises={exercises ?? []} />
      </div>
    </div>
  )
}
