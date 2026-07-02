'use client'
import { useEffect, useState } from 'react'

const T1 = 'var(--text-primary,#fff)'
const T2 = 'var(--text-secondary,#888)'
const T3 = 'var(--text-tertiary,#44445a)'
const CARD = 'var(--card-bg,rgba(255,255,255,.04))'
const BDR = 'var(--card-border,rgba(255,255,255,.08))'
const ACC = 'var(--accent-color,#C8FF00)'

interface Props {
  sessionId: string
  locale: string
}

interface Suggestion {
  id: string
  recommendation_type: string
  recommendation_text: string
  reasoning: string | null
}

export function ProgressionSuggestionsPanel({ sessionId, locale }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const isEs = locale === 'es'

  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/ai/suggestions?sessionId=${sessionId}`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
        <p style={{ margin: 0, fontSize: 12, color: T3, fontFamily: 'DM Mono,monospace' }}>
          {isEs ? 'Analizando tu sesión...' : 'Analyzing your session...'}
        </p>
      </div>
    )
  }

  if (!suggestions.length) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: CARD, border: `1px solid ${BDR}`, borderRadius: 14 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
        <p style={{ margin: 0, fontSize: 13, color: T2, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>
          {isEs ? '¡Buen entrenamiento!' : 'Great workout!'}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace' }}>
          {isEs ? 'Sin cambios necesarios por ahora.' : 'No changes needed for now.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {isEs ? 'Sugerencias IA' : 'AI Suggestions'}
      </p>
      {suggestions.map(s => (
        <div key={s.id} style={{
          padding: '14px 16px', background: CARD,
          border: `1px solid ${BDR}`, borderRadius: 14,
          borderLeft: `3px solid ${ACC}`,
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: T1, fontFamily: 'Syne,sans-serif' }}>
            {s.recommendation_text}
          </p>
          {s.reasoning && (
            <p style={{ margin: 0, fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace', lineHeight: 1.5 }}>
              {s.reasoning}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
