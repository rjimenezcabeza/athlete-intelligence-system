import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { OfflineIndicator } from '@/components/shared/OfflineIndicator'

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

  // Usar SERVICE_ROLE_KEY para leer JWT de cookies — sin BOM
  const supabase = createServerClient(url, serviceKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <OfflineIndicator />
      <main className="flex-1 pb-24 overflow-y-auto">{children}</main>
      <BottomNav locale={locale} />
    </div>
  )
}
