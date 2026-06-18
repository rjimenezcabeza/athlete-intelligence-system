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
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addingExercise, setAddingExercise] = useState(false)

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

  async function searchExercises(q: string) {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.exercises ?? [])
    } catch { setSearchResults([]) }
    finally { setSearchLoading(false) }
  }

  async function handleAddExercise(exercise: any) {
    if (!activeSession?.id || addingExercise) return
    setAddingExercise(true)
    try {
      const res = await fetch('/api/sessions/add-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.id, exerciseId: exercise.id })
      })
      const data = await res.json()
      if (res.ok) {
        const { addExercise } = useSessionStore.getState()
        addExercise({
          id: data.session_exercise_id,
          session_exercise_id: data.session_exercise_id,
          exercise_id: exercise.id,
          name: exercise.name,
          muscle_group_primary: exercise.muscle_group_primary,
          slug: exercise.slug ?? '',
          order_in_session: exercises.length + 1,
          sets: []
        })
        setShowSearch(false)
        setSearchQuery('')
        setSearchResults([])
      }
    } catch {}
    finally { setAddingExercise(false) }
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
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
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
        <>
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
          <button
            onClick={() => setShowSearch(true)}
            style={{
              width: '100%',
              padding: '14px',
              background: '#111118',
              border: '1px dashed #C8FF0033',
              borderRadius: '12px',
              color: '#C8FF00',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
              marginTop: exercises.length > 0 ? '16px' : '0',
              letterSpacing: '0.05em',
            }}
          >
            + Añadir ejercicio
          </button>
        </>
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

          <button
            onClick={() => setShowSearch(true)}
            style={{
              width: '100%',
              padding: '14px',
              background: '#111118',
              border: '1px dashed #C8FF0033',
              borderRadius: '12px',
              color: '#C8FF00',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
              marginTop: exercises.length > 0 ? '16px' : '0',
              letterSpacing: '0.05em',
            }}
          >
            + Añadir ejercicio
          </button>
        </>
      )}

      {showSearch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSearch(false) }}
        >
          <div style={{
            background: '#111118',
            borderRadius: '20px 20px 0 0',
            padding: '20px 16px',
            maxHeight: '70vh',
            display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: '700', fontFamily: 'Syne, sans-serif' }}>
                Añadir ejercicio
              </span>
              <button onClick={() => setShowSearch(false)}
                style={{ background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <input
              autoFocus
              value={searchQuery}
              onChange={e => searchExercises(e.target.value)}
              placeholder="Buscar ejercicio..."
              style={{
                width: '100%', padding: '12px 16px',
                background: '#1a1a2e', border: '1px solid #2a2a3e',
                borderRadius: '12px', color: '#fff', fontSize: '15px',
                outline: 'none', marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {searchLoading && (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Buscando...</div>
              )}
              {!searchLoading && searchResults.length === 0 && searchQuery.length > 0 && (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Sin resultados</div>
              )}
              {searchResults.map(ex => (
                <button key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  disabled={addingExercise}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid #1a1a2e',
                    cursor: addingExercise ? 'not-allowed' : 'pointer',
                  }}>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', fontFamily: 'Syne, sans-serif' }}>
                    {ex.name}
                  </div>
                  <div style={{ color: '#C8FF00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif', marginTop: '2px' }}>
                    {ex.muscle_group_primary}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
