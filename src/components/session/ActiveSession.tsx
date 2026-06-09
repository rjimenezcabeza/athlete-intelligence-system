'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { SetLogger } from './SetLogger'

interface ActiveSessionProps {
  sessionId: string
  locale: string
}

export function ActiveSession({ sessionId, locale }: ActiveSessionProps) {
  const router = useRouter()
  const {
    activeSession,
    exercises,
    currentExerciseIndex,
    setCurrentExerciseIndex,
    setActiveSession,
    clearSession,
  } = useSessionStore()

  const [ending, setEnding] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!activeSession?.started_at) return
    const start = new Date(activeSession.started_at).getTime()
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeSession])

  useEffect(() => {
    if (!activeSession) {
      fetch('/api/sessions/active')
        .then((r) => r.json())
        .then((data) => {
          if (data.session) setActiveSession(data.session)
        })
        .catch(() => {})
    }
  }, [activeSession, setActiveSession])

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '00')}`
  }

  async function handleEndSession() {
    if (!activeSession?.id) return
    setEnding(true)
    try {
      const res = await fetch(`/api/sessions/${activeSession.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      clearSession()
      if (json.redirect_to === 'feedback') {
        router.push(`/${locale}/session/${activeSession.id}/feedback`)
      } else {
        router.push(`/${locale}/dashboard`)
      }
    } catch {
      setEnding(false)
    }
  }

  const currentExercise = exercises[currentExerciseIndex]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      color: '#fff',
      padding: '16px',
      maxWidth: '480px',
      margin: '0 auto',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div style={{
          color: '#C8FF00',
          fontSize: '28px',
          fontWeight: '700',
          fontFamily: 'DM Mono, monospace',
          letterSpacing: '0.05em',
        }}>
          {formatTime(elapsedSeconds)}
        </div>
        <button
          onClick={handleEndSession}
          disabled={ending}
          style={{
            background: 'transparent',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            color: '#ff4444',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'Syne, sans-serif',
            cursor: ending ? 'not-allowed' : 'pointer',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {ending ? 'Finalizando...' : 'Finalizar'}
        </button>
      </div>

      {exercises.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#666',
          padding: '48px 16px',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>+</div>
          <div style={{ fontSize: '16px', marginBottom: '8px', color: '#999' }}>
            Sin ejercicios
          </div>
          <div style={{ fontSize: '13px' }}>
            Agrega ejercicios para comenzar a registrar
          </div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            marginBottom: '24px',
            paddingBottom: '4px',
          }}>
            {exercises.map((ex, i) => (
              <button
                key={ex.id}
                onClick={() => setCurrentExerciseIndex(i)}
                style={{
                  background: i === currentExerciseIndex ? '#C8FF00' : '#1a1a2e',
                  color: i === currentExerciseIndex ? '#0A0A0F' : '#999',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Syne, sans-serif',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {ex.name}
              </button>
            ))}
          </div>

          {currentExercise && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  fontFamily: 'Syne, sans-serif',
                  marginBottom: '4px',
                }}>
                  {currentExercise.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#C8FF00',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'Syne, sans-serif',
                }}>
                  {currentExercise.muscle_group_primary}
                </div>
              </div>

              {currentExercise.sets.map((set, i) => (
                <div
                  key={i}
                  style={{
                    background: '#111118',
                    border: '1px solid #1e3a1e',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#C8FF00', fontSize: '13px', fontWeight: '700', fontFamily: 'Syne, sans-serif' }}>
                    Serie {set.set_number}
                  </span>
                  <span style={{ color: '#fff', fontSize: '16px', fontWeight: '700', fontFamily: 'DM Mono, monospace' }}>
                    {set.weight_kg}kg x {set.reps_completed}
                  </span>
                  {set.rir_actual !== null && (
                    <span style={{ color: '#666', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>
                      RIR {set.rir_actual}
                    </span>
                  )}
                </div>
              ))}

              {currentExercise.session_exercise_id && (
                <SetLogger
                  sessionId={sessionId}
                  sessionExerciseId={currentExercise.session_exercise_id}
                  exerciseIndex={currentExerciseIndex}
                  setNumber={currentExercise.sets.length + 1}
                  lastSet={currentExercise.sets[currentExercise.sets.length - 1] || null}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
