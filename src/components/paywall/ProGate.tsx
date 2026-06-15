'use client'

import Link from 'next/link'

interface ProGateProps {
  locale: string
  feature: string
  children: React.ReactNode
  isPro: boolean
}

export default function ProGate({ locale, feature, children, isPro }: ProGateProps) {
  const isEs = locale === 'es'
  if (isPro) return <>{children}</>

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-40">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
        style={{ background: '#0A0A0Fcc' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold mb-3"
          style={{ background: '#C8FF00', color: '#0A0A0F' }}>
          PRO
        </div>
        <p className="font-bold mb-1" style={{ color: '#fff' }}>
          {isEs ? `${feature} es Pro` : `${feature} is Pro`}
        </p>
        <p className="text-xs mb-4" style={{ color: '#888' }}>
          {isEs ? 'Actualiza para desbloquear' : 'Upgrade to unlock'}
        </p>
        <Link href={`/${locale}/upgrade`}
          className="px-5 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: '#C8FF00', color: '#0A0A0F' }}>
          {isEs ? 'Ver planes' : 'See plans'} - EUR 14.99/mes
        </Link>
      </div>
    </div>
  )
}
