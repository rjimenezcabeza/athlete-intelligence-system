'use client'

import { useState, useEffect, useCallback } from 'react'

export interface SetRecord {
  setNumber: number
  weightKg: number
  repsCompleted: number
  rirActual?: number | null
  isPR?: boolean
}

export interface LastPerformance {
  sets: SetRecord[]
  sessionDate: string
  summary: {
    totalSets: number
    avgWeight: number | null
    maxWeight: number | null
  }
  history: {
    bestWeightKg: number | null
    avgWeightLast4w: number | null
    weightTrend: number | null
    best1rmEstimated: number | null
    totalSessions: number
  } | null
}

export function useLastPerformance(exerciseId: string | null) {
  const [data, setData] = useState<LastPerformance | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!exerciseId) { setData(null); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/last-performance`)
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setData(json.lastPerformance)
    } catch {
      setError('load_failed')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [exerciseId])

  useEffect(() => { fetch_() }, [fetch_])

  return { lastPerformance: data, isLoading: loading, error, refetch: fetch_ }
}
