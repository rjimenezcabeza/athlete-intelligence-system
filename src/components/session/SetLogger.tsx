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
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center' as const,
    width: '100%',
    padding: '12px 8px',
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
    </div>
  )
}
