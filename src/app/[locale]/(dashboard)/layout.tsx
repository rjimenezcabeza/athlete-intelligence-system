import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { OfflineIndicator } from '@/components/shared/OfflineIndicator'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const cookieStore = await cookies()
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  const supabase = createServerClient(url, serviceKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  let accentColor = '#C8FF00'
  try {
    const { data: prof } = await (supabase as any)
      .from('athlete_profiles')
      .select('accent_color')
      .eq('user_id', user.id)
      .single()
    if (prof?.accent_color) accentColor = prof.accent_color
  } catch {}

  return (
    <ThemeProvider initialAccent={accentColor}>
      <div className="min-h-screen" style={{ '--accent-color': accentColor, '--accent-bg': `${accentColor}12`, '--accent-border': `${accentColor}30` } as React.CSSProperties}>
        <OfflineIndicator />
        <main className="flex-1 pb-24 overflow-y-auto">{children}</main>
        <BottomNav locale={locale} />
      </div>
    </ThemeProvider>
  )
}
