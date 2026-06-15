'use client'

import { useEffect, useState } from 'react'

export interface DashboardSummary {
  profile: {
    id: string
    display_name: string
    subscription_tier: string
    primary_goal: string | null
    training_experience_years: number | null
  }
  stats: {
    totalSessions: number
    streak: number
    avgDuration: number
    avgFeedback: {
      pump: number
      fatigue: number
      recovery: number
      rir: number
    } | null
  }
  weeklyChart: { week: string; volume: number; sets: number }[]
  patterns: {
    id: string
    pattern_type: string
    title_es: string
    title_en: string
    description_es: string
    description_en: string
    severity: string
  }[]
  progressions: {
    id: string
    exercise_id: string
    action_type: string
    new_weight_kg: number | null
    new_reps_target: number | null
    reasoning_es: string
    reasoning_en: string
    created_at: string
    exercises: { name: string } | null
  }[]
  recommendations: {
    id: string
    recommendation_type: string
    recommendation_text: string
    created_at: string
  }[]
  recentSessions: {
    id: string
    session_date: string
    duration_minutes: number | null
    pump_rating: number | null
    local_fatigue: number | null
    perceived_recovery: number | null
    rir_session_avg: number | null
  }[]
}

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
