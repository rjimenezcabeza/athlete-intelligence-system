import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CoachChat } from '@/components/coach/CoachChat'

export default async function CoachPage({ params }: { params: Promise<{ locale: string }> }) {
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
  const isPro = profile.subscription_tier === 'pro'

  const t = {
    title: 'AI Coach',
    subtitle: lang === 'en'
      ? 'Powered by your real training data'
      : 'Impulsado por tus datos reales de entrenamiento',
    pro_badge: 'PRO',
    free_badge: lang === 'en' ? 'FREE' : 'GRATIS',
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {t.title}
          </h1>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full font-mono ${
            isPro
              ? 'bg-[#C8FF00]/20 text-[#C8FF00] border border-[#C8FF00]/30'
              : 'bg-white/10 text-white/40 border border-white/10'
          }`}>
            {isPro ? t.pro_badge : t.free_badge}
          </span>
        </div>
        <p className="text-white/40 text-sm">{t.subtitle}</p>
      </div>

      {/* Chat */}
      <div className="flex-1 px-4 flex flex-col min-h-0" style={{ minHeight: '500px' }}>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col flex-1">
          <CoachChat language={lang} isPro={isPro} />
        </div>
      </div>
    </div>
  )
}
