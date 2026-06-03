'use client'
import { useEffect, useRef } from 'react'

export function useWakeLock() {
  const ref = useRef<WakeLockSentinel | null>(null)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    const request = async () => {
      try { ref.current = await navigator.wakeLock.request('screen') } catch {}
    }
    request()
    const onVisible = () => { if (document.visibilityState === 'visible') request() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      ref.current?.release().catch(() => {})
    }
  }, [])
}
