import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import PostSessionFeedback from '@/components/session/PostSessionFeedback'

interface Props {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function FeedbackPage({ params }: Props) {
  const { locale, id } = await params

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const svc = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  const cookieStore = await cookies()
  const supabase = createServerClient(url, svc, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const admin = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: profile } = await (admin as any)
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect(`/${locale}/dashboard`)

  const { data: session } = await (admin as any)
    .from('training_sessions')
    .select('id, status')
    .eq('id', id)
    .eq('athlete_id', profile.id)
    .single()

  if (!session || session.status === 'completed') {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <PostSessionFeedback
      sessionId={id}
      locale={locale}
    />
  )
}

export const metadata = {
  title: 'Feedback Post-Sesión | AIS',
}
