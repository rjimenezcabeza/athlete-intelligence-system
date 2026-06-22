'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ActiveMesocycle {
  id: string
  name: string
  goal: string | null
  total_weeks: number
  current_week: number
  started_at: string
  status: string
  deload_week: number | null
  sessions_this_week: number
  week_start: string
  is_deload_week: boolean
  progress_percent: number
  training_templates: {
    name: string
    split_type: string | null
    training_days_per_week: number | null
  } | null
}

export function useMesocycle() {
  const [mesocycle, setMesocycle] = useState<ActiveMesocycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mesocycles')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setMesocycle(data.mesocycle)
    } catch {
      setError('load_failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const create = useCallback(async (payload: {
    name: string
    goal?: string
    totalWeeks: number
    templateId?: string
    deloadWeek?: number
    startDate?: string
  }) => {
    const res = await fetch('/api/mesocycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('create failed')
    const data = await res.json()
    await fetch_()
    return data.mesocycle
  }, [fetch_])

  const finish = useCallback(async (id: string) => {
    await fetch(`/api/mesocycles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    })
    await fetch_()
  }, [fetch_])

  return { mesocycle, loading, error, refetch: fetch_, create, finish }
}
