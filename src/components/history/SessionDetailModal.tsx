'use client'

import { useState, useEffect } from 'react'

interface SetRecord {
  setNumber: number
  setType: string
  weightKg: number | null
  repsCompleted: number | null
  rirActual: number | null
  isPR: boolean
}

interface ExerciseRecord {
  name: string
  muscleGroup: string
  sets: SetRecord[]
  totalVolume: number
  avgWeight: number | null
  maxWeight: number | null
}

interface SessionDetail {
  id: string
  sessionDate: string
  durationMinutes: number | null
  pumpRating: number | null
  localFatigue: number | null
  perceivedRecovery: number | null
  exercises: ExerciseRecord[]
  totalSets: number
  totalVolume: number
  bodyWeightKg: number | null
  notes: string | null
}

const MUSCLE_COLORS: Record<string, string> = {
  pecho: '#FF6B35', chest: '#FF6B35',
  dorsales: '#4CAF50', back: '#4CAF50', espalda: '#4CAF50',
  deltoides: '#00BCD4', shoulders: '#00BCD4',
  biceps: '#9C27B0', bicep: '#9C27B0',
  triceps: '#673AB7', tricep: '#673AB7',
  cuadriceps: '#FF9800', quads: '#FF9800',
  isquiotibiales: '#F44336', hamstrings: '#F44336',
  gluteos: '#E91E63', glutes: '#E91E63',
  gemelos: '#795548', calves: '#795548',
  core: '#607D8B', abdominales: '#607D8B',
  trapecios: '#3F51B5', traps: '#3F51B5',
}

interface Props {
  sessionId: string
  onClose: () => void
  locale?: string
  weightUnit?: string
}

export function SessionDetailModal({ sessionId, onClose, locale = 'es', weightUnit = 'kg' }: Props) {
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const isEs = locale === 'es'

  const fmt = (n: number | null) => {
    if (n == null) return '-'
    return weightUnit === 'lbs' ? `${Math.round(n * 2.2046)} lbs` : `${n} kg`
  }

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/detail`)
      .then(r => r.json())
      .then(d => setSession(d.session ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#0f0f14', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>
              {session ? new Date(session.sessionDate + 'T12:00:00').toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif' }}>
              {isEs ? 'Detalle de sesión' : 'Session detail'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '18px', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />)}
            </div>
          ) : session ? (
            <>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
                {[
                  { label: isEs ? 'Duración' : 'Duration', value: session.durationMinutes ? `${session.durationMinutes}min` : '-', color: '#C8FF00' },
                  { label: 'Pump', value: session.pumpRating ? `${session.pumpRating}/5` : '-', color: session.pumpRating && session.pumpRating >= 4 ? '#C8FF00' : '#888' },
                  { label: isEs ? 'Fatiga' : 'Fatigue', value: session.localFatigue ? `${session.localFatigue}/5` : '-', color: session.localFatigue && session.localFatigue >= 4 ? '#FF9800' : '#888' },
                  { label: 'Sets', value: String(session.totalSets), color: '#C8FF00' },
                ].map((kpi, i) => (
                  <div key={i} style={{ padding: '10px 6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: kpi.color, fontFamily: 'DM Mono, monospace', marginBottom: '2px' }}>{kpi.value}</div>
                    <div style={{ fontSize: '9px', color: '#555', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Total volume + muscle breakdown */}
              {session.totalVolume > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ padding: '12px 14px', background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      {isEs ? 'Volumen total' : 'Total volume'}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#C8FF00', fontFamily: 'DM Mono, monospace' }}>
                      {fmt(session.totalVolume)}
                    </span>
                  </div>
                  {(() => {
                    const byMuscle: Record<string, number> = {}
                    session.exercises.forEach(ex => { byMuscle[ex.muscleGroup] = (byMuscle[ex.muscleGroup] || 0) + ex.totalVolume })
                    const sorted = Object.entries(byMuscle).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
                    if (sorted.length < 2) return null
                    const max = sorted[0][1]
                    return (
                      <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                          {isEs ? 'Por músculo' : 'By muscle'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          {sorted.map(([muscle, vol]) => {
                            const color = MUSCLE_COLORS[muscle.toLowerCase()] || '#666'
                            return (
                              <div key={muscle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{muscle}</span>
                                  <span style={{ fontSize: '11px', color, fontFamily: 'DM Mono, monospace' }}>{fmt(vol)}</span>
                                </div>
                                <div style={{ height: '4px', borderRadius: '2px', background: '#1a1a2e', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', borderRadius: '2px', background: color, width: ((vol / max) * 100) + '%', transition: 'width 0.5s ease' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Exercises */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {session.exercises.map((ex, i) => {
                  const muscleKey = ex.muscleGroup.toLowerCase()
                  const color = MUSCLE_COLORS[muscleKey] || '#666'
                  const hasPR = ex.sets.some(s => s.isPR)
                  return (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#ddd', fontFamily: 'Syne, sans-serif' }}>{ex.name}</span>
                            {hasPR && <span style={{ fontSize: '9px', color: '#FFC107', fontFamily: 'DM Mono, monospace', padding: '1px 5px', background: 'rgba(255,193,7,0.15)', borderRadius: '4px', border: '1px solid rgba(255,193,7,0.3)' }}>PR</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace', paddingLeft: '16px' }}>{ex.muscleGroup}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {ex.maxWeight != null && <div style={{ fontSize: '13px', fontWeight: '600', color: '#C8FF00', fontFamily: 'DM Mono, monospace' }}>{fmt(ex.maxWeight)}</div>}
                          <div style={{ fontSize: '10px', color: '#555', fontFamily: 'DM Mono, monospace' }}>{ex.sets.filter(s => s.setType === 'working').length} sets</div>
                        </div>
                      </div>

                      <div style={{ padding: '8px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 40px', gap: '4px', marginBottom: '6px' }}>
                          {['#', isEs ? 'Peso' : 'Weight', 'Reps', 'RIR'].map((h, j) => (
                            <span key={j} style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace' }}>{h}</span>
                          ))}
                        </div>
                        {ex.sets.filter(s => s.setType === 'working').map((s, j) => (
                          <div key={j} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 40px', gap: '4px', padding: '4px 0', borderTop: j > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace' }}>S{s.setNumber}</span>
                            <span style={{ fontSize: '13px', color: s.isPR ? '#FFC107' : '#ccc', fontFamily: 'DM Mono, monospace', fontWeight: s.isPR ? '700' : '400' }}>{fmt(s.weightKg)}</span>
                            <span style={{ fontSize: '13px', color: '#ccc', fontFamily: 'DM Mono, monospace' }}>{s.repsCompleted ?? '-'}</span>
                            <span style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace' }}>{s.rirActual ?? '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Notes */}
              {session.notes && (
                <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>{isEs ? 'Notas' : 'Notes'}</div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#888', lineHeight: '1.5' }}>{session.notes}</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#555', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
              {isEs ? 'No se pudo cargar la sesión' : 'Could not load session'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
