import { ActiveSession } from '@/components/training/ActiveSession'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params
  return <ActiveSession sessionId={id} />
}
