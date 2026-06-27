import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { OfflineIndicator } from '@/components/shared/OfflineIndicator'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { getPaletteById, buildCssVars } from '@/lib/palettes'

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
  let paletteId = 'default'
  try {
    const { data: prof } = await (supabase as any)
      .from('athlete_profiles')
      .select('accent_color, color_palette')
      .eq('user_id', user.id)
      .single()
    if (prof?.accent_color) accentColor = prof.accent_color
    if (prof?.color_palette) paletteId = prof.color_palette
  } catch {}

  const palette = getPaletteById(paletteId)
  const cssVars = buildCssVars(palette, accentColor)

  return (
    <ThemeProvider initialAccent={accentColor} initialPaletteId={paletteId}>
      <div style={cssVars as React.CSSProperties}>
        <OfflineIndicator />
        <main className="flex-1 pb-24 overflow-y-auto">{children}</main>
        <BottomNav locale={locale} />
      </div>
    </ThemeProvider>
  )
}
