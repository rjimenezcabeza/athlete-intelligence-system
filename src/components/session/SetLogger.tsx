'use client'

import { useState } from 'react'
import { useSessionStore, ActiveSet } from '@/stores/session.store'

interface SetLoggerProps {
  sessionId: string
  sessionExerciseId: string
  exerciseIndex: number
  setNumber: number
  lastSet?: ActiveSet | null
}

export function SetLogger({
  sessionId,
  sessionExerciseId,
  exerciseIndex,
  setNumber,
  lastSet,
}: SetLoggerProps) {
  const { addSet } = useSessionStore()
  const [weight, setWeight] = useState(lastSet?.weight_kg?.toString() || '')
  const [reps, setReps] = useState(lastSet?.reps_completed?.toString() || '')
  const [rir, setRir] = useState(lastSet?.rir_actual?.toString() || '2')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleLog() {
    if (!weight || !reps) return
    setSaving(true)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_exercise_id: sessionExerciseId,
          set_number: setNumber,
          set_type: 'working',
          weight_kg: parseFloat(weight),
          reps_completed: parseInt(reps),
          rir_actual: rir ? parseInt(rir) : null,
          notes: null,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      addSet(exerciseIndex, {
        id: data.set.id,
        set_number: setNumber,
        set_type: 'working',
        weight_kg: parseFloat(weight),
        reps_completed: parseInt(reps),
        rir_actual: rir ? parseInt(rir) : null,
        rpe_actual: null,
        notes: null,
        logged_at: data.set.logged_at,
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '28px',
    fontWeight: '700',
    textAlign: 'center' as const,
    width: '100%',
    padding: '20px 8px',
    fontFamily: 'DM Mono, monospace',
    outline: 'none',
  }

  const labelStyle = {
    color: '#666',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
    fontFamily: 'Syne, sans-serif',
  }

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #222',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '12px',
    }}>
      <style>{`
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        .bounce-in { animation: bounceIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
      `}</style>
      <div style={{
        color: '#C8FF00',
        fontSize: '13px',
        fontWeight: '700',
        fontFamily: 'Syne, sans-serif',
        marginBottom: '16px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Serie {setNumber}
      </div>

      {lastSet && (
        <div style={{ textAlign: 'center', color: '#555', fontSize: '12px', fontFamily: 'DM Mono, monospace', marginBottom: '12px' }}>
          Última vez: {lastSet.weight_kg}kg × {lastSet.reps_completed}
          {lastSet.rir_actual !== null && ` · RIR ${lastSet.rir_actual}`}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={labelStyle}>KG</div>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            style={inputStyle}
            inputMode="decimal"
          />
        </div>
        <div>
          <div style={labelStyle}>Reps</div>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="0"
            style={inputStyle}
            inputMode="numeric"
          />
        </div>
        <div>
          <div style={labelStyle}>RIR</div>
          <input
            type="number"
            value={rir}
            onChange={(e) => setRir(e.target.value)}
            placeholder="2"
            style={inputStyle}
            inputMode="numeric"
          />
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={handleLog}
          disabled={saving || !weight || !reps}
          style={{
            background: saved ? '#22c55e' : saving ? '#333' : '#C8FF00',
            color: '#0A0A0F',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '700',
            fontFamily: 'Syne, sans-serif',
            cursor: (saving || !weight || !reps) ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'background 0.2s',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {saved ? 'Serie guardada' : saving ? 'Guardando...' : 'Registrar Serie'}
        </button>
        {saved && (
          <div className="bounce-in" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#22c55e', borderRadius: '10px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
