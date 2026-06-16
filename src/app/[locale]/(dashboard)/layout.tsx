import { createServerSideClient } from '@/lib/supabase/server'
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
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  return (
    <div className='min-h-screen' style={{ background: '#0A0A0F' }}>
      <OfflineIndicator />
      <main className='flex-1 pb-24 overflow-y-auto'>{children}</main>
      <BottomNav locale={locale} />
    </div>
  )
}