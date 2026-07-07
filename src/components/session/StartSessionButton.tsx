'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'

interface StartSessionButtonProps {
  locale: string
  templateId?: string
  dayNumber?: number
  dayLabel?: string
}

export function StartSessionButton({
  locale,
  templateId,
  dayNumber,
  dayLabel,
}: StartSessionButtonProps) {
  const router = useRouter()
  const { setActiveSession, setLoading, setError } = useSessionStore()
  const [isStarting, setIsStarting] = useState(false)

  async function handleStart() {
    setIsStarting(true)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId || null,
          day_number: dayNumber || null,
          day_label: dayLabel || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start session')
      }

      setActiveSession(data.session)
      router.push(`/${locale}/session/${data.session.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(msg)
      setIsStarting(false)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={isStarting}
      style={{
        background: isStarting ? '#333' : '#C8FF00',
        color: '#0A0A0F',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 32px',
        fontSize: '16px',
        fontWeight: '700',
        fontFamily: 'Syne, sans-serif',
        cursor: isStarting ? 'not-allowed' : 'pointer',
        width: '100%',
        transition: 'background 0.2s',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {isStarting ? 'Iniciando...' : 'Iniciar Sesion'}
    </button>
  )
}
