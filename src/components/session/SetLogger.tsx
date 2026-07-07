'use client'
import { useState, useCallback } from 'react'
import { useSessionStore } from '@/stores/session.store'

interface SetLoggerProps {
  sessionId: string
  sessionExerciseId: string
  exerciseIndex: number
  setNumber: number
  lastSet?: any
}

const TYPES = [
  { key: 'working',    label: 'Working',    color: '#C8FF00', desc: 'Serie de trabajo' },
  { key: 'warmup',     label: 'Warm-up',    color: '#FBBF24', desc: 'Calentamiento' },
  { key: 'top_set',    label: 'Top Set',    color: '#A78BFA', desc: 'Serie tope' },
  { key: 'backoff',    label: 'Back-off',   color: '#60A5FA', desc: 'Descarga' },
  { key: 'drop_set',   label: 'Drop Set',   color: '#FF6B6B', desc: '-15-20% peso, sin descanso' },
  { key: 'rest_pause', label: 'Rest Pause', color: '#F97316', desc: '10-15s pausa, más reps' },
  { key: 'myo_reps',   label: 'Myo Reps',  color: '#EC4899', desc: '3-5 mini-series de activación' },
]

const RIR_OPTIONS = [0, 1, 2, 3, 4]

function StepperField({
  label, value, unit, onInc, onDec, onChange,
  step = 1, accent = '#C8FF00'
}: {
  label: string; value: string; unit?: string;
  onInc: () => void; onDec: () => void;
  onChange: (v: string) => void;
  step?: number; accent?: string
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        fontFamily: 'Syne, sans-serif', color: '#44445a'
      }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Decrement */}
        <button onClick={onDec} style={{
          width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)', color: '#888', fontSize: 20, fontWeight: 300,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s', userSelect: 'none',
          flexShrink: 0,
        }}
          onMouseDown={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
          onMouseUp={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onTouchStart={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
          onTouchEnd={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        >−</button>

        {/* Value display / input */}
        <div style={{ minWidth: 72, textAlign: 'center' }}>
          {editing ? (
            <input
              autoFocus
              type="number"
              value={value}
              onChange={e => onChange(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditing(false) }}
              inputMode="decimal"
              style={{
                width: '100%', textAlign: 'center',
                background: 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${accent}60`, borderRadius: 10,
                color: '#F0F0F5', fontFamily: 'DM Mono, monospace',
                fontSize: 26, fontWeight: 700, padding: '4px 6px', outline: 'none',
                WebkitAppearance: 'none', MozAppearance: 'textfield',
              }}
            />
          ) : (
            <button onClick={() => setEditing(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%'
            }}>
              <span style={{
                display: 'block',
                fontSize: 32, fontWeight: 800, color: value ? '#F0F0F5' : '#2a2a3e',
                fontFamily: 'DM Mono, monospace', lineHeight: 1, letterSpacing: '-0.02em'
              }}>
                {value || '—'}
              </span>
              {unit && (
                <span style={{ fontSize: 10, color: '#44445a', fontFamily: 'DM Mono, monospace' }}>
                  {unit}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Increment */}
        <button onClick={onInc} style={{
          width: 40, height: 40, borderRadius: 12, border: `1px solid ${accent}30`,
          background: `${accent}10`, color: accent, fontSize: 20, fontWeight: 300,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s', userSelect: 'none',
          flexShrink: 0,
        }}
          onMouseDown={e => (e.currentTarget.style.background = `${accent}25`)}
          onMouseUp={e => (e.currentTarget.style.background = `${accent}10`)}
          onTouchStart={e => (e.currentTarget.style.background = `${accent}25`)}
          onTouchEnd={e => (e.currentTarget.style.background = `${accent}10`)}
        >+</button>
      </div>
    </div>
  )
}

export function SetLogger({ sessionId, sessionExerciseId, exerciseIndex, setNumber, lastSet }: SetLoggerProps) {
  const { addSet } = useSessionStore()
  const [weight, setWeight] = useState(lastSet?.weight_kg?.toString() ?? '')
  const [reps, setReps]     = useState(lastSet?.reps_completed?.toString() ?? '')
  const [rir, setRir]       = useState(lastSet?.rir_actual?.toString() ?? '2')
  const [type, setType]     = useState('working')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')

  const activeType = TYPES.find(t => t.key === type)
  const accentColor = activeType?.color ?? '#C8FF00'

  // Steppers
  const incWeight = useCallback(() => {
    setWeight(v => String(Math.max(0, parseFloat(v || '0') + 2.5)))
  }, [])
  const decWeight = useCallback(() => {
    setWeight(v => {
      const cur = parseFloat(v || '0')
      return String(Math.max(0, cur >= 2.5 ? cur - 2.5 : 0))
    })
  }, [])
  const incReps = useCallback(() => {
    setReps(v => String(Math.max(1, parseInt(v || '0') + 1)))
  }, [])
  const decReps = useCallback(() => {
    setReps(v => String(Math.max(1, parseInt(v || '1') - 1)))
  }, [])

  const handleLog = async () => {
    if (!weight || !reps) return
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/sessions/' + sessionId + '/sets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_exercise_id: sessionExerciseId,
          set_number: setNumber,
          set_type: type,
          weight_kg: parseFloat(weight),
          reps_completed: parseInt(reps),
          rir_actual: rir !== '' ? parseInt(rir) : null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addSet(exerciseIndex, {
        id: data.set.id, set_number: setNumber, set_type: type as any,
        weight_kg: parseFloat(weight), reps_completed: parseInt(reps),
        rir_actual: rir !== '' ? parseInt(rir) : null,
        rpe_actual: null, notes: null,
        logged_at: data.set.logged_at
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
    setSaving(false)
  }

  return (
    <div style={{
      background: '#111118',
      border: `1px solid ${accentColor}20`,
      borderRadius: 20, padding: '18px 16px 16px', marginBottom: 12,
      transition: 'border-color 0.25s',
    }}>
      {/* ── Series type selector ── */}
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 5, width: 'max-content', paddingBottom: 2 }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)} style={{
              padding: '5px 10px', borderRadius: 8, whiteSpace: 'nowrap',
              fontSize: 10, fontWeight: 700, fontFamily: 'Syne, sans-serif',
              cursor: 'pointer', letterSpacing: '0.05em',
              background: type === t.key ? t.color + '22' : 'transparent',
              color: type === t.key ? t.color : '#2e2e44',
              border: '1px solid ' + (type === t.key ? t.color + '44' : '#1a1a2e'),
              transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      {activeType?.desc && (
        <p style={{ margin: '0 0 16px', fontSize: 10, color: accentColor + '88', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}>
          ↳ {activeType.desc}
        </p>
      )}

      {/* ── Stepper inputs: KG | REPS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <StepperField
          label="Peso (kg)" value={weight} unit="kg"
          onInc={incWeight} onDec={decWeight}
          onChange={setWeight} step={2.5} accent={accentColor}
        />
        <StepperField
          label="Reps" value={reps}
          onInc={incReps} onDec={decReps}
          onChange={setReps} step={1} accent={accentColor}
        />
      </div>

      {/* ── RIR quick selector ── */}
      <div style={{ marginBottom: 16 }}>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          fontFamily: 'Syne, sans-serif', color: '#44445a', marginBottom: 8, textAlign: 'center'
        }}>RIR — Reps en reserva</p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {RIR_OPTIONS.map(r => (
            <button key={r} onClick={() => setRir(String(r))} style={{
              width: 44, height: 44, borderRadius: 12,
              background: rir === String(r) ? accentColor + '22' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${rir === String(r) ? accentColor + '60' : 'rgba(255,255,255,0.07)'}`,
              color: rir === String(r) ? accentColor : '#44445a',
              fontSize: 18, fontWeight: 800, fontFamily: 'DM Mono, monospace',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{r}</button>
          ))}
        </div>
        <p style={{ textAlign: 'center', margin: '6px 0 0', fontSize: 9, color: '#2a2a3e', fontFamily: 'DM Mono, monospace' }}>
          {rir === '0' ? 'Fallo muscular' : rir === '1' ? 'Casi fallo' : rir === '2' ? 'Duro' : rir === '3' ? 'Moderado' : 'Fácil'}
        </p>
      </div>

      {err && <p style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 10, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>{err}</p>}

      {/* ── Log button ── */}
      <button onClick={handleLog} disabled={saving || !weight || !reps} style={{
        width: '100%', border: 'none', borderRadius: 14, padding: '18px 0',
        fontSize: 15, fontWeight: 800, fontFamily: 'Syne, sans-serif',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        cursor: (saving || !weight || !reps) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        background: saved
          ? 'linear-gradient(135deg,#22c55e,#16a34a)'
          : saving
          ? '#1a1a2e'
          : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
        color: (saved || saving) ? '#fff' : '#0A0A0F',
        opacity: (!weight || !reps) ? 0.35 : 1,
        boxShadow: saved ? '0 4px 16px rgba(34,197,94,0.3)'
          : (saving || !weight || !reps) ? 'none'
          : `0 4px 20px ${accentColor}35`,
        transform: (!weight || !reps) ? 'none' : 'translateY(0)',
      }}>
        {saved ? '✓ Guardada' : saving ? 'Guardando...' : `Registrar Serie ${setNumber}`}
      </button>
    </div>
  )
}

export function CompletedSet({ set, exerciseIndex, setIndex, sessionId }: {
  set: any; exerciseIndex: number; setIndex: number; sessionId: string
}) {
  const { removeSet } = useSessionStore()
  const [del, setDel] = useState(false)
  const typeColors: Record<string, string> = {
    working: '#C8FF00', warmup: '#FBBF24', top_set: '#A78BFA', backoff: '#60A5FA',
    drop_set: '#FF6B6B', rest_pause: '#F97316', myo_reps: '#EC4899'
  }
  const col = typeColors[set.set_type] ?? '#C8FF00'

  const handleDel = async () => {
    if (!set.id || del) return
    if (!confirm('Borrar esta serie?')) return
    setDel(true)
    try {
      await fetch('/api/sessions/' + sessionId + '/sets', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: set.id })
      })
      removeSet(exerciseIndex, setIndex)
    } catch {}
    setDel(false)
  }

  return (
    <div style={{
      background: col + '08',
      border: '1px solid ' + col + '20',
      borderLeft: '3px solid ' + col,
      borderRadius: 12, padding: '10px 14px', marginBottom: 6,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      transition: 'opacity 0.2s', opacity: del ? 0.4 : 1,
    }}>
      <span style={{ color: col, fontSize: 10, fontWeight: 800, fontFamily: 'Syne, sans-serif', minWidth: 24, letterSpacing: '0.06em' }}>
        S{set.set_number}
      </span>
      <span style={{ color: '#F0F0F5', fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono, monospace', flex: 1, textAlign: 'center', letterSpacing: '-0.01em' }}>
        {set.weight_kg}<span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>kg</span>
        {' × '}
        {set.reps_completed}<span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>r</span>
      </span>
      <span style={{ color: '#2a2a3e', fontSize: 10, fontFamily: 'DM Mono, monospace', minWidth: 40, textAlign: 'right' }}>
        {set.rir_actual !== null ? `RIR${set.rir_actual}` : ''}
      </span>
      <button onClick={handleDel} disabled={del} style={{
        background: 'none', border: 'none', color: '#2a2a3e',
        cursor: 'pointer', fontSize: 16, padding: '0 0 0 10px', transition: 'color 0.15s', lineHeight: 1,
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#FF6B6B')}
        onMouseLeave={e => (e.currentTarget.style.color = '#2a2a3e')}
      >×</button>
    </div>
  )
}
