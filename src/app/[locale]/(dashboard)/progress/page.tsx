import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ChartsClient from './ChartsClient'

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const cookieStore = await cookies()

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const svc = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  const supabase = createServerClient(url, svc, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} }
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const admin = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: profile } = await (admin as any)
    .from('athlete_profiles')
    .select('id, display_name, language, subscription_tier')
    .eq('user_id', user.id).single()
  if (!profile) redirect(`/${locale}/onboarding`)

  const lang = profile.language || locale
  const since8w = new Date()
  since8w.setDate(since8w.getDate() - 56)

  const [sessionsRes, exercisesRes] = await Promise.all([
    (admin as any)
      .from('training_sessions')
      .select('session_date, pump_rating, local_fatigue, perceived_recovery, duration_minutes')
      .eq('athlete_id', profile.id).eq('status', 'completed')
      .gte('session_date', since8w.toISOString().split('T')[0])
      .order('session_date'),

    (admin as any)
      .from('exercise_history')
      .select('exercises(id, name, muscle_group_primary), total_sessions, best_weight_kg')
      .eq('athlete_id', profile.id)
      .order('total_sessions', { ascending: false })
      .limit(10)
  ])

  const sessions = sessionsRes.data ?? []
  const feedbackData = sessions
    .filter((s: any) => s.pump_rating || s.local_fatigue || s.perceived_recovery)
    .map((s: any) => ({
      date: new Date(s.session_date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: '2-digit', month: 'short' }),
      pump: s.pump_rating,
      fatigue: s.local_fatigue,
      recovery: s.perceived_recovery
    }))

  const statsData = {
    total_sessions: sessions.length,
    avg_duration: sessions.length > 0
      ? Math.round(sessions.reduce((s: number, x: any) => s + (x.duration_minutes ?? 0), 0) / sessions.length)
      : 0,
    avg_pump: sessions.filter((s: any) => s.pump_rating).length > 0
      ? (sessions.filter((s: any) => s.pump_rating).reduce((s: number, x: any) => s + x.pump_rating, 0) / sessions.filter((s: any) => s.pump_rating).length).toFixed(1)
      : null
  }

  const topExercises = (exercisesRes.data ?? [])
    .filter((h: any) => h.exercises)
    .map((h: any) => ({
      id: h.exercises.id,
      name: h.exercises.name,
      muscle: h.exercises.muscle_group_primary,
      sessions: h.total_sessions,
      bestWeight: h.best_weight_kg
    }))

  return <ChartsClient
    language={lang}
    feedbackData={feedbackData}
    statsData={statsData}
    locale={locale}
    topExercises={topExercises}
  />
}
