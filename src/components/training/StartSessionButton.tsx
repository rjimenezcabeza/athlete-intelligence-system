'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StartSessionButtonProps {
  templateId?: string
  label?: string
}

export function StartSessionButton({ templateId, label = 'Iniciar Sesión' }: StartSessionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      // Garantizar que existe el perfil de atleta
      await fetch('/api/profile/ensure', { method: 'POST' })

      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: templateId ?? null }),
      })
      const { sessionId, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)
      router.push(`/session/${sessionId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
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
        ) : label}
      </button>
      {error && (
        <p className="text-red-400 text-xs font-mono text-center">{error}</p>
      )}
    </div>
  )
}
