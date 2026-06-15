import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ChartsClient from './ChartsClient'

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
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

  const since8w = new Date()
  since8w.setDate(since8w.getDate() - 56)

  const { data: sessions } = await (supabase as any)
    .from('training_sessions')
    .select('session_date, pump_rating, local_fatigue, perceived_recovery, duration_minutes')
    .eq('athlete_id', profile.id)
    .eq('status', 'completed')
    .gte('session_date', since8w.toISOString().split('T')[0])
    .order('session_date')

  const feedbackData = (sessions || [])
    .filter((s: any) => s.pump_rating || s.local_fatigue || s.perceived_recovery)
    .map((s: any) => ({
      date: new Date(s.session_date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: '2-digit', month: 'short' }),
      pump: s.pump_rating,
      fatigue: s.local_fatigue,
      recovery: s.perceived_recovery
    }))

  const statsData = {
    total_sessions: sessions?.length || 0,
    avg_duration: sessions && sessions.length > 0
      ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) / sessions.length)
      : 0,
    avg_pump: sessions && sessions.filter((s: any) => s.pump_rating).length > 0
      ? (sessions.filter((s: any) => s.pump_rating).reduce((sum: number, s: any) => sum + s.pump_rating, 0) / sessions.filter((s: any) => s.pump_rating).length).toFixed(1)
      : null
  }

  return <ChartsClient
    language={lang}
    feedbackData={feedbackData}
    statsData={statsData}
    locale={locale}
  />
}
