'use client'
import { useEffect, useState } from 'react'

interface DashboardStats {
  weekSessions: number
  weekVolume: number
  streak: number
  monthPRs: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentPRs: any[]
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { stats, loading }
}
