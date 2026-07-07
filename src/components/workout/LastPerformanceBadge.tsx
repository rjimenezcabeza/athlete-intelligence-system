'use client'
import { useEffect, useState } from 'react'

const T2 = 'var(--text-secondary,#888)'
const T3 = 'var(--text-tertiary,#44445a)'
const CARD = 'var(--card-bg,rgba(255,255,255,.04))'
const BDR = 'var(--card-border,rgba(255,255,255,.08))'

interface Props {
  exerciseId: string
  locale: string
}

interface PerformanceEntry {
  date: string
  maxWeight: number
}

export function LastPerformanceBadge({ exerciseId, locale }: Props) {
  const [last, setLast] = useState<PerformanceEntry | null>(null)
  const [prev, setPrev] = useState<PerformanceEntry | null>(null)
  const isEs = locale === 'es'

  useEffect(() => {
    if (!exerciseId) return
    fetch(`/api/progress/exercise?id=${exerciseId}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data?.length) return
        setLast(data[data.length - 1])
        if (data.length > 1) setPrev(data[data.length - 2])
      })
      .catch(() => {})
  }, [exerciseId])

  if (!last) return null

  const diff = prev ? last.maxWeight - prev.maxWeight : null
  const trend = diff === null ? null : diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'

  const fmt = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', marginBottom: 10,
      background: CARD, border: `1px solid ${BDR}`,
      borderRadius: 10,
    }}>
      <span style={{ fontSize: 14 }}>📊</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace' }}>
          {isEs ? 'Última vez' : 'Last time'} · {fmt(last.date)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T2, fontFamily: 'DM Mono,monospace' }}>
            {last.maxWeight} kg
          </span>
          {trend === 'up' && diff !== null && (
            <span style={{ fontSize: 10, color: '#4ADE80', fontFamily: 'DM Mono,monospace' }}>
              ↑ +{diff.toFixed(1)}kg
            </span>
          )}
          {trend === 'down' && diff !== null && (
            <span style={{ fontSize: 10, color: '#FF6B6B', fontFamily: 'DM Mono,monospace' }}>
              ↓ {diff.toFixed(1)}kg
            </span>
          )}
          {trend === 'flat' && (
            <span style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono,monospace' }}>= sin cambio</span>
          )}
        </div>
      </div>
    </div>
  )
}
