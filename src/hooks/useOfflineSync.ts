'use client'
import { useEffect, useCallback, useState } from 'react'
import { syncPendingData } from '@/lib/offline/sync'
import { createClient } from '@/lib/supabase/client'

export function useOfflineSync() {
  const supabase = createClient()
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const sync = useCallback(async () => {
    if (!navigator.onLine) return
    const result = await syncPendingData(supabase)
    if (result.synced > 0) setLastSync(new Date())
  }, [supabase])

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); sync() }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const interval = setInterval(() => { if (navigator.onLine) sync() }, 30_000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(interval)
    }
  }, [sync])

  return { isOnline, lastSync, syncNow: sync }
}
