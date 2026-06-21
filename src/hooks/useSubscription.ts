'use client'
import { useState } from 'react'

export function useSubscription(locale: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale })
      })
      // No redirigir automaticamente — mostrar error claro
      if (res.status === 401) {
        setError(locale === 'es'
          ? 'Sesion expirada. Recarga la pagina e inicia sesion de nuevo.'
          : 'Session expired. Reload the page and log in again.')
        setLoading(false); return
      }
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('application/json')) {
        setError('Error del servidor. Intenta de nuevo.'); setLoading(false); return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setLoading(false)
    }
  }

  const openPortal = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale })
      })
      if (res.status === 401) {
        setError(locale === 'es' ? 'Sesion expirada. Recarga la pagina.' : 'Session expired. Reload the page.')
        setLoading(false); return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setLoading(false)
    }
  }

  return { startCheckout, openPortal, loading, error }
}
