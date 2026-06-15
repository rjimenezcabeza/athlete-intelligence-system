'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UpgradeSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'

  useEffect(() => {
    const timer = setTimeout(() => router.push(`/${locale}/dashboard`), 4000)
    return () => clearTimeout(timer)
  }, [locale, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0A0A0F' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold mb-6"
        style={{ background: '#C8FF00', color: '#0A0A0F' }}>
        PRO
      </div>
      <h1 className="text-3xl font-bold mb-3 text-center" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
        {isEs ? 'Bienvenido a Pro' : 'Welcome to Pro'}
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: '#888' }}>
        {isEs
          ? 'Tu cuenta ha sido actualizada. Ahora tienes acceso completo al sistema.'
          : 'Your account has been upgraded. You now have full system access.'}
      </p>
      <p className="text-xs" style={{ color: '#555' }}>
        {isEs ? 'Redirigiendo al dashboard...' : 'Redirecting to dashboard...'}
      </p>
    </div>
  )
}
