'use client'
import { useState } from 'react'
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

export function SetLogger({ sessionId, sessionExerciseId, exerciseIndex, setNumber, lastSet }: SetLoggerProps) {
  const { addSet } = useSessionStore()
  const [weight, setWeight] = useState(lastSet?.weight_kg?.toString() ?? '')
  const [reps, setReps] = useState(lastSet?.reps_completed?.toString() ?? '')
  const [rir, setRir] = useState(lastSet?.rir_actual?.toString() ?? '2')
  const [type, setType] = useState('working')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const numStyle: React.CSSProperties = {
    width: '100%', textAlign: 'center', background: '#16161f',
    border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 14,
    color: '#F0F0F5', fontFamily: 'DM Mono, monospace',
    fontSize: 30, fontWeight: 700, padding: '14px 6px', outline: 'none',
    WebkitAppearance: 'none', MozAppearance: 'textfield'
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#44445a', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    fontFamily: 'Syne, sans-serif', marginBottom: 6
  }

  const handleLog = async () => {
    if (!weight || !reps) return
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/sessions/' + sessionId + '/sets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_exercise_id: sessionExerciseId, set_number: setNumber,
          set_type: type, weight_kg: parseFloat(weight),
          reps_completed: parseInt(reps), rir_actual: rir ? parseInt(rir) : null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addSet(exerciseIndex, {
        id: data.set.id, set_number: setNumber, set_type: type as any,
        weight_kg: parseFloat(weight), reps_completed: parseInt(reps),
        rir_actual: rir ? parseInt(rir) : null, rpe_actual: null, notes: null,
        logged_at: data.set.logged_at
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
    setSaving(false)
  }

  const activeType = TYPES.find(t => t.key === type)

  return (
    <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 20, marginBottom: 12 }}>
      {/* Type selector — scrollable row */}
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 6, width: 'max-content', paddingBottom: 2 }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)} style={{
              padding: '6px 10px', borderRadius: 9, whiteSpace: 'nowrap',
              fontSize: 10, fontWeight: 700, fontFamily: 'Syne, sans-serif',
              cursor: 'pointer', letterSpacing: '0.05em',
              background: type === t.key ? t.color + '22' : 'transparent',
              color: type === t.key ? t.color : '#44445a',
              border: '1px solid ' + (type === t.key ? t.color + '44' : '#1a1a2e'),
              transition: 'all 0.15s'
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      {/* Type description */}
      {activeType?.desc && (
        <p style={{ margin: '0 0 14px', fontSize: 10, color: activeType.color + '99', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}>
          ↳ {activeType.desc}
        </p>
      )}

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div><span style={labelStyle}>KG</span><input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={numStyle} inputMode="decimal" placeholder="0" onFocus={e => (e.target.style.borderColor = 'rgba(200,255,0,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} /></div>
        <div><span style={labelStyle}>REPS</span><input type="number" value={reps} onChange={e => setReps(e.target.value)} style={numStyle} inputMode="numeric" placeholder="0" onFocus={e => (e.target.style.borderColor = 'rgba(200,255,0,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} /></div>
        <div><span style={labelStyle}>RIR</span><input type="number" value={rir} onChange={e => setRir(e.target.value)} style={numStyle} inputMode="numeric" placeholder="2" onFocus={e => (e.target.style.borderColor = 'rgba(200,255,0,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} /></div>
      </div>

      {err && <p style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{err}</p>}

      <button onClick={handleLog} disabled={saving || !weight || !reps} style={{
        width: '100%', border: 'none', borderRadius: 13, padding: 17,
        fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: (saving || !weight || !reps) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        background: saved ? '#22c55e' : saving ? '#1a1a2e' : 'linear-gradient(135deg,#C8FF00,#88DD00)',
        color: (saved || saving) ? '#fff' : '#0A0A0F',
        opacity: (!weight || !reps) ? 0.4 : 1,
        boxShadow: saved || saving || !weight || !reps ? 'none' : '0 4px 16px rgba(200,255,0,0.3)'
      }}>
        {saved ? '✓ Guardada' : saving ? 'Guardando...' : 'Registrar Serie ' + setNumber}
      </button>
    </div>
  )
}

export function CompletedSet({ set, exerciseIndex, setIndex, sessionId }: { set: any; exerciseIndex: number; setIndex: number; sessionId: string }) {
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
      background: '#0d0d14', border: '1px solid ' + col + '22',
      borderRadius: 12, padding: '12px 16px', marginBottom: 6,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <span style={{ color: col, fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', minWidth: 28 }}>S{set.set_number}</span>
      <span style={{ color: '#F0F0F5', fontSize: 20, fontWeight: 700, fontFamily: 'DM Mono, monospace', flex: 1, textAlign: 'center' }}>
        {set.weight_kg}kg × {set.reps_completed}
      </span>
      <span style={{ color: '#44445a', fontSize: 11, fontFamily: 'DM Mono, monospace', minWidth: 48, textAlign: 'right' }}>
        {set.rir_actual !== null ? 'RIR ' + set.rir_actual : ''}
      </span>
      <button onClick={handleDel} disabled={del} style={{
        background: 'none', border: 'none', color: '#2a2a3e',
        cursor: 'pointer', fontSize: 18, padding: '0 0 0 12px', transition: 'color 0.15s'
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#FF6B6B')}
        onMouseLeave={e => (e.currentTarget.style.color = '#2a2a3e')}>×</button>
    </div>
  )
}
