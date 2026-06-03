import { createServerSideClient } from '@/lib/supabase/server'
export default async function DashboardPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('athlete_profiles').select('*').eq('user_id', user!.id).single()
  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-xl font-semibold">Hola, {profile?.display_name ?? 'Atleta'} 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[['Sesiones esta semana','—'],['Volumen total','—'],['Racha actual','—'],['PRs este mes','—']].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <p className="text-sm font-medium mb-1">Próxima sesión</p>
        <p className="text-sm text-muted-foreground">Crea una plantilla para empezar</p>
      </div>
    </div>
  )
}
