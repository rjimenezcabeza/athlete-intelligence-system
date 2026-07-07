import { ActiveSession } from '@/components/session/ActiveSession'

interface SessionPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { locale, id } = await params
  return (
    <ActiveSession
      sessionId={id}
      locale={locale}
    />
  )
}

export const metadata = {
  title: 'Sesion Activa | AIS',
}
