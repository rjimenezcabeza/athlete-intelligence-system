'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StartSessionButtonProps {
  templateDayId?: string
  label?: string
}

export function StartSessionButton({ templateDayId, label = 'Iniciar Sesión' }: StartSessionButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateDayId: templateDayId ?? null }),
      })
      const { sessionId, error } = await res.json()
      if (error) throw new Error(error)
      router.push(`/session/${sessionId}`)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="w-full py-4 rounded-2xl bg-[#C8FF00] text-black font-bold text-lg tracking-tight transition-all active:scale-95 disabled:opacity-50 hover:brightness-110"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          Iniciando...
        </span>
      ) : (
        label
      )}
    </button>
  )
}
