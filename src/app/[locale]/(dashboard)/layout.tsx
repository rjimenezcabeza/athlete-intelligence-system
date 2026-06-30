import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  let customBgColor: string | null = null
  try {
    const { data: prof2 } = await (supabase as any)
      .from('athlete_profiles')
      .select('custom_bg_color')
      .eq('user_id', user.id)
      .single()
    if (prof2?.custom_bg_color) customBgColor = prof2.custom_bg_color
  } catch {}

  const palette = getPaletteById(paletteId)
  const cssVars = buildCssVars(palette, accentColor)
  // --bg-primary applied via <style> tag so client ThemeProvider can override it without CSS specificity fights
  const bgPrimary = customBgColor || palette.bg
  const { '--bg-primary': _ignored, ...cssVarsWithoutBg } = cssVars as Record<string, string>

  return (
    <ThemeProvider initialAccent={accentColor} initialPaletteId={paletteId} initialBg={bgPrimary}>
      <style dangerouslySetInnerHTML={{ __html: `:root { --bg-primary: ${bgPrimary}; }` }} />
      <div style={cssVarsWithoutBg as React.CSSProperties}>
        <OfflineIndicator />
        {/* Floating profile icon — top-right, always accessible */}
        <Link href={`/${locale}/profile`} style={{
          position: 'fixed', top: 'max(env(safe-area-inset-top,0px) + 12px, 16px)', right: 16, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary,#888)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </Link>
        <main className="flex-1 pb-24 overflow-y-auto">{children}</main>
        <BottomNav locale={locale} />
      </div>
    </ThemeProvider>
  )
}
