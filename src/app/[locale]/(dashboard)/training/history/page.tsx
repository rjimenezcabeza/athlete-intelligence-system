import { createServerSideClient } from '@/lib/supabase/server'
export default async function HistoryPage() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('athlete_profiles').select('id').eq('user_id', user!.id).single()
  const { data: sessions } = await supabase.from('training_sessions').select('*').eq('athlete_id', profile?.id ?? '').order('session_date', { ascending: false }).limit(20)
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Historial</h1>
      {!sessions?.length ? (
        <p className="text-sm text-muted-foreground text-center py-12">Aún no hay sesiones registradas.<br/>¡Completa tu primera sesión!</p>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{s.day_label ?? 'Sesión'}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              </div>
              {s.duration_minutes && <p className="text-xs text-muted-foreground mt-1">⏱ {s.duration_minutes} min</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
