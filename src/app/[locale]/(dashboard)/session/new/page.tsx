'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewSessionPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_date: new Date().toISOString().split('T')[0] })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error starting session')
      router.push(`/${locale}/session/${data.session.id}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24"
      style={{ background: '#0A0A0F' }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
        {isEs ? 'Nueva sesion' : 'New session'}
      </h1>
      <p className="text-sm mb-10" style={{ color: '#666' }}>
        {isEs ? 'Empieza a registrar tu entrenamiento' : 'Start logging your workout'}
      </p>
      <button
        onClick={startSession}
        disabled={loading}
        className="w-full max-w-sm py-5 rounded-2xl font-bold text-xl disabled:opacity-50"
        style={{ background: '#C8FF00', color: '#0A0A0F', fontFamily: 'Syne, sans-serif' }}
      >
        {loading ? (isEs ? 'Iniciando...' : 'Starting...') : (isEs ? 'Iniciar entrenamiento' : 'Start workout')}
      </button>
      {error && <p className="mt-4 text-sm" style={{ color: '#FF6B6B' }}>{error}</p>}
    </div>
  )
}
