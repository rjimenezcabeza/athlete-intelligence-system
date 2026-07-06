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

const UI: Record<string, { analyzing: string; great: string; noChanges: string; suggestions: string }> = {
  es: { analyzing: 'Analizando tu sesión...', great: '¡Buen entrenamiento!', noChanges: 'Sin cambios necesarios por ahora.', suggestions: 'Sugerencias IA' },
  en: { analyzing: 'Analyzing your session...', great: 'Great workout!', noChanges: 'No changes needed for now.', suggestions: 'AI Suggestions' },
  fr: { analyzing: 'Analyse de ta séance...', great: 'Bel entraînement!', noChanges: 'Aucun changement nécessaire.', suggestions: 'Suggestions IA' },
  de: { analyzing: 'Analysiere deine Session...', great: 'Gutes Training!', noChanges: 'Keine Änderungen nötig.', suggestions: 'KI-Vorschläge' },
  it: { analyzing: 'Analizzando la tua sessione...', great: 'Ottimo allenamento!', noChanges: 'Nessuna modifica necessaria.', suggestions: 'Suggerimenti IA' },
  nl: { analyzing: 'Je sessie analyseren...', great: 'Geweldige training!', noChanges: 'Geen wijzigingen nodig.', suggestions: 'AI-suggesties' },
}

export function ProgressionSuggestionsPanel({ sessionId, locale }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const t = UI[locale] ?? UI.es

  useEffect(() => {
    if (!sessionId) return
    fetch('/api/ai/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, locale }),
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId, locale])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
        <p style={{ margin: 0, fontSize: 12, color: T3, fontFamily: 'DM Mono,monospace' }}>
          {t.analyzing}
        </p>
      </div>
    )
  }

  if (!suggestions.length) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: CARD, border: `1px solid ${BDR}`, borderRadius: 14 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
        <p style={{ margin: 0, fontSize: 13, color: T2, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>
          {t.great}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace' }}>
          {t.noChanges}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {t.suggestions}
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
