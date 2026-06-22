'use client'

import { useState, useEffect } from 'react'

interface Suggestion {
  id: string
  action_type: string
  prev_weight_kg: number | null
  new_weight_kg: number | null
  new_reps_target: number | null
  reasoning_es: string
  reasoning_en: string
  applied: boolean
  exercises: { name: string; muscle_group_primary: string } | null
}

const ACTION_ICONS: Record<string, string> = {
  increase_weight: '↑',
  increase_reps: '+',
  maintain_weight: '→',
}

const ACTION_COLORS: Record<string, string> = {
  increase_weight: '#C8FF00',
  increase_reps: '#4CAF50',
  maintain_weight: '#888888',
}

interface Props {
  sessionId: string
  locale?: string
  weightUnit?: 'kg' | 'lbs'
  onDismiss?: () => void
}

export function ProgressionSuggestionsPanel({ sessionId, locale = 'es', weightUnit = 'kg', onDismiss }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const fmt = (n: number | null) => {
    if (!n) return '-'
    return weightUnit === 'lbs' ? `${Math.round(n * 2.2046)}lbs` : `${n}kg`
  }

  useEffect(() => {
    fetch(`/api/progression/session-summary?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(d => setSuggestions(d.suggestions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleApply = async (id: string, applied: boolean) => {
    await fetch('/api/progression/session-summary', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId: id, applied })
    })
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, applied } : s))
  }

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  const visible = suggestions.filter(s => !dismissed.has(s.id))

  if (loading || visible.length === 0) return null

  const title = locale === 'es' ? 'Sugerencias para la proxima sesion' : 'Suggestions for next session'
  const applyLabel = locale === 'es' ? 'Aplicar' : 'Apply'
  const skipLabel = locale === 'es' ? 'Omitir' : 'Skip'

  return (
    <div style={{ padding: '20px', background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#C8FF00', fontFamily: 'Syne, sans-serif' }}>
          {title}
        </h3>
        <span style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
          {visible.length} {locale === 'es' ? 'ejercicios' : 'exercises'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {visible.map(s => {
          const color = ACTION_COLORS[s.action_type] || '#888'
          const icon = ACTION_ICONS[s.action_type] || ''
          const reasoning = locale === 'es' ? s.reasoning_es : s.reasoning_en

          return (
            <div key={s.id} style={{
              padding: '12px 14px',
              background: s.applied ? 'rgba(200,255,0,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.applied ? 'rgba(200,255,0,0.2)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color, fontFamily: 'DM Mono, monospace', fontWeight: 'bold' }}>{icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#ddd', fontFamily: 'DM Mono, monospace' }}>
                      {s.exercises?.name || 'Ejercicio'}
                    </span>
                    {s.new_weight_kg && s.prev_weight_kg && s.new_weight_kg !== s.prev_weight_kg && (
                      <span style={{ fontSize: '12px', color, fontFamily: 'DM Mono, monospace' }}>
                        {fmt(s.prev_weight_kg)} → {fmt(s.new_weight_kg)}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888', lineHeight: '1.4', fontFamily: 'Inter, sans-serif' }}>
                    {reasoning}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {!s.applied ? (
                    <>
                      <button
                        onClick={() => handleApply(s.id, true)}
                        style={{ padding: '6px 10px', background: 'rgba(200,255,0,0.15)', border: '1px solid rgba(200,255,0,0.3)', borderRadius: '6px', color: '#C8FF00', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}
                      >
                        {applyLabel}
                      </button>
                      <button
                        onClick={() => handleDismiss(s.id)}
                        style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#666', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}
                      >
                        {skipLabel}
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#C8FF00', fontFamily: 'DM Mono, monospace', padding: '6px 0' }}>
                      {locale === 'es' ? 'Anotado' : 'Noted'} ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
