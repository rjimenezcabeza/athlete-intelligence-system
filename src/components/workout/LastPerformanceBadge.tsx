'use client'

import { useLastPerformance } from '@/hooks/useLastPerformance'

const T: Record<string, Record<string, string>> = {
  es: { last: 'Ultima sesion', first: 'Primera vez', pr: 'Record', load: 'Cargando...', sessions: 'sesiones' },
  en: { last: 'Last session', first: 'First time', pr: 'PR', load: 'Loading...', sessions: 'sessions' },
  fr: { last: 'Derniere session', first: 'Premiere fois', pr: 'Record', load: 'Chargement...', sessions: 'sessions' },
  de: { last: 'Letzte Einheit', first: 'Erstes Mal', pr: 'Rekord', load: 'Laden...', sessions: 'Einheiten' },
  it: { last: 'Ultima sessione', first: 'Prima volta', pr: 'Record', load: 'Caricamento...', sessions: 'sessioni' },
  nl: { last: 'Laatste sessie', first: 'Eerste keer', pr: 'Record', load: 'Laden...', sessions: 'sessies' }
}

interface Props {
  exerciseId: string
  weightUnit?: 'kg' | 'lbs'
  locale?: string
}

export function LastPerformanceBadge({ exerciseId, weightUnit = 'kg', locale = 'es' }: Props) {
  const { lastPerformance, isLoading } = useLastPerformance(exerciseId)
  const t = T[locale] || T.es
  const fmt = (n: number) => weightUnit === 'lbs' ? `${Math.round(n * 2.2046)}lbs` : `${n}kg`

  if (isLoading) {
    return (
      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
        {t.load}
      </div>
    )
  }

  if (!lastPerformance) {
    return (
      <div style={{ padding: '8px 12px', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: '8px', fontSize: '12px', color: '#C8FF00', fontFamily: 'DM Mono, monospace' }}>
        {t.first}
      </div>
    )
  }

  const { sets, history, sessionDate } = lastPerformance
  const trend = history?.weightTrend
  const trendEl = trend !== null && trend !== undefined
    ? { icon: trend > 0.5 ? '↑' : trend < -0.5 ? '↓' : '→', color: trend > 0.5 ? '#C8FF00' : trend < -0.5 ? '#FF6B6B' : '#666' }
    : null

  return (
    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
          {t.last} {new Date(sessionDate + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
        </span>
        {trendEl && (
          <span style={{ fontSize: '13px', color: trendEl.color, fontFamily: 'DM Mono, monospace', fontWeight: 'bold' }}>
            {trendEl.icon}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {sets.slice(0, 6).map((s, i) => (
          <div key={i} style={{
            padding: '4px 8px',
            background: s.isPR ? 'rgba(255,193,7,0.15)' : 'rgba(200,255,0,0.08)',
            border: s.isPR ? '1px solid rgba(255,193,7,0.3)' : '1px solid rgba(200,255,0,0.1)',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'DM Mono, monospace',
            color: s.isPR ? '#FFC107' : '#C8FF00',
            whiteSpace: 'nowrap'
          }}>
            {fmt(s.weightKg)} x {s.repsCompleted}
            {s.rirActual != null && <span style={{ color: '#666', fontSize: '10px' }}> @{s.rirActual}</span>}
            {s.isPR && <span style={{ fontSize: '10px', marginLeft: '3px' }}>PR</span>}
          </div>
        ))}
      </div>
      {history && (history.bestWeightKg || history.totalSessions > 0) && (
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace', flexWrap: 'wrap' }}>
          {history.bestWeightKg && <span>{t.pr}: <span style={{ color: '#FFC107' }}>{fmt(history.bestWeightKg)}</span></span>}
          {history.totalSessions > 0 && <span>{history.totalSessions} {t.sessions}</span>}
          {history.best1rmEstimated && <span>1RM: <span style={{ color: '#C8FF00' }}>{fmt(Math.round(history.best1rmEstimated))}</span></span>}
        </div>
      )}
    </div>
  )
}
