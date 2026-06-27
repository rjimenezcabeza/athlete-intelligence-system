import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CoachChat } from '@/components/coach/CoachChat'

const BG = 'var(--bg-primary)', CARD = 'var(--card-bg)', ACC = 'var(--accent-color)', T1 = 'var(--text-primary)', T2 = 'var(--text-secondary)', T3 = 'var(--text-tertiary)', BORDER = 'var(--card-border)'

export default async function CoachPage({ params }: { params: Promise<{ locale: string }> }) {
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
    .eq('user_id', user.id)
    .single()
  if (!profile) redirect(`/${locale}/onboarding`)

  const { count: sessionCount } = await (admin as any)
    .from('training_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('athlete_id', profile.id)
    .eq('status', 'completed')

  const lang = profile.language || locale
  const isPro = profile.subscription_tier === 'pro'
  const isEs = lang === 'es'

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', paddingBottom: 96 }}>

      {/* Header */}
      <div style={{ padding: '32px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, color: T1, letterSpacing: '-0.02em' }}>
            AI Coach
          </h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif', background: isPro ? 'rgba(200,255,0,0.15)' : 'rgba(255,255,255,0.06)', color: isPro ? ACC : T3, border: '1px solid ' + (isPro ? 'rgba(200,255,0,0.3)' : 'rgba(255,255,255,0.08)') }}>
            {isPro ? 'PRO' : (isEs ? 'GRATIS' : 'FREE')}
          </span>
        </div>
        {sessionCount != null && (
          <p style={{ fontSize: 13, color: T2, fontFamily: 'Inter, sans-serif' }}>
            {isEs
              ? `${sessionCount} sesiones analizadas · Historial real`
              : `${sessionCount} sessions analyzed · Real history`}
          </p>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, padding: '0 20px 0', display: 'flex', flexDirection: 'column', minHeight: 500 }}>
        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 20, padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CoachChat language={lang} isPro={isPro} />
        </div>
      </div>
    </div>
  )
}
