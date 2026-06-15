import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PatternCard } from '@/components/memory/PatternCard'
import { ExerciseHistoryCard } from '@/components/memory/ExerciseHistoryCard'

export default async function MemoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id, display_name, language, subscription_tier')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect(`/${locale}/onboarding`)

  const lang = profile.language || locale

  // Obtener patrones activos
  const { data: patterns } = await (supabase as any)
    .from('athlete_patterns')
    .select('*, exercises(id, name, slug)')
    .eq('athlete_id', profile.id)
    .eq('is_active', true)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(5)

  // Obtener historial top ejercicios
  const { data: exerciseHistory } = await (supabase as any)
    .from('exercise_history')
    .select('*, exercises(name, slug, muscle_group_primary, equipment)')
    .eq('athlete_id', profile.id)
    .order('total_sessions', { ascending: false })
    .limit(6)

  // Stats globales
  const { data: stats } = await (supabase as any)
    .from('training_sessions')
    .select('id', { count: 'exact' })
    .eq('athlete_id', profile.id)
    .eq('status', 'completed')

  const totalSessions = stats?.length || 0

  const t = {
    title: lang === 'en' ? 'Athlete Memory' : 'Memoria del Atleta',
    subtitle: lang === 'en' ? 'Your training patterns and history' : 'Tus patrones y historial de entrenamiento',
    sessions: lang === 'en' ? 'Sessions' : 'Sesiones',
    patterns_title: lang === 'en' ? 'Active Insights' : 'Insights Activos',
    history_title: lang === 'en' ? 'Exercise History' : 'Historial de Ejercicios',
    no_patterns: lang === 'en' ? 'No active insights. Keep training!' : '¡Sin insights activos. Sigue entrenando!',
    no_history: lang === 'en' ? 'No history yet. Log your first session!' : 'Sin historial aún. ¡Registra tu primera sesión!',
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {t.title}
          </h1>
          <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1">
            <span className="text-[#C8FF00] font-bold text-sm font-mono">{totalSessions}</span>
            <span className="text-white/40 text-xs">{t.sessions}</span>
          </div>
        </div>
        <p className="text-white/40 text-sm">{t.subtitle}</p>
      </div>

      <div className="px-4 space-y-6">
        {/* Insights / Patrones */}
        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3 font-mono">
            {t.patterns_title}
          </h2>
          {patterns && patterns.length > 0 ? (
            <div className="space-y-3">
              {patterns.map((p: any) => (
                <PatternCard key={p.id} pattern={p} language={lang} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
              <p className="text-white/30 text-sm">🧠 {t.no_patterns}</p>
            </div>
          )}
        </section>

        {/* Historial de ejercicios */}
        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3 font-mono">
            {t.history_title}
          </h2>
          {exerciseHistory && exerciseHistory.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {exerciseHistory.map((h: any) => (
                <ExerciseHistoryCard key={h.id} history={h} language={lang} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
              <p className="text-white/30 text-sm">📊 {t.no_history}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
