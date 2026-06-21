'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { SetLogger, CompletedSet } from './SetLogger'

interface ActiveSessionProps { sessionId: string; locale: string }
interface ExResult { id: string; name: string; muscle_group_primary: string; slug: string }

const MC: Record<string, string> = {
  chest: '#FF6B6B', back: '#4ECDC4', shoulders: '#A78BFA', arms: '#FBBF24',
  legs: '#60A5FA', core: '#F97316', glutes: '#EC4899', calves: '#10B981',
  'deltoides lateral': '#A78BFA', 'pecho': '#FF6B6B',
}
const mc = (m: string) => MC[m?.toLowerCase()] ?? '#C8FF00'

export function ActiveSession({ sessionId, locale }: ActiveSessionProps) {
  const router = useRouter()
  const { activeSession, exercises, currentExerciseIndex, setCurrentExerciseIndex,
    setActiveSession, addExercise, clearSession } = useSessionStore()
  const [ending, setEnding] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ExResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [inputFocus, setInputFocus] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEs = locale === 'es'

  useEffect(() => {
    fetch('/api/sessions/active').then(r => r.json()).then(d => {
      if (d.session) setActiveSession(d.session)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const startStr = activeSession?.started_at
    if (!startStr) return
    const start = new Date(startStr).getTime()
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [activeSession?.started_at])

  useEffect(() => {
    if (!showSearch) return
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const d = await fetch('/api/exercises/search?q=' + encodeURIComponent(query)).then(r => r.json())
        setResults(d.exercises ?? [])
      } catch {}
      setSearching(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query, showSearch])

  useEffect(() => {
    if (showSearch) {
      fetch('/api/exercises/search?q=').then(r => r.json()).then(d => setResults(d.exercises ?? [])).catch(() => {})
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [showSearch])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(sc).padStart(2, '00')
    return String(m).padStart(2, '0') + ':' + String(sc).padStart(2, '00')
  }

  const addEx = async (ex: ExResult) => {
    setAdding(true)
    try {
      const res = await fetch('/api/sessions/add-exercise', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, exerciseId: ex.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addExercise({
        id: ex.id, session_exercise_id: data.sessionExercise.id, exercise_id: ex.id,
        name: ex.name, muscle_group_primary: ex.muscle_group_primary,
        slug: ex.slug, order_in_session: data.sessionExercise.order_in_session, sets: []
      })
      setCurrentExerciseIndex(exercises.length)
      setShowSearch(false); setQuery('')
    } catch (e) { console.error(e) }
    setAdding(false)
  }

  const endSession = async () => {
    if (!activeSession?.id || ending) return
    setEnding(true)
    try {
      const res = await fetch('/api/sessions/' + (activeSession.id ?? sessionId) + '/end', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        await fetch('/api/sessions/' + sessionId + '/end', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }
        })
      }
      clearSession()
      router.push('/' + locale + '/session/' + (activeSession.id ?? sessionId) + '/feedback')
    } catch (e) {
      console.error(e)
      setEnding(false)
    }
  }

  const cur = exercises[currentExerciseIndex]
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F0F0F5', maxWidth: 480, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 16px' }}>
        <div>
          <div style={{ color: '#C8FF00', fontSize: 36, fontWeight: 700, fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em', lineHeight: 1 }}>
            {fmt(elapsed)}
          </div>
          <div style={{ color: '#44445a', fontSize: 11, fontFamily: 'Syne, sans-serif', marginTop: 3, letterSpacing: '0.06em' }}>
            {exercises.length} {isEs ? 'ej' : 'ex'} · {totalSets} {isEs ? 'series' : 'sets'}
          </div>
        </div>
        <button onClick={endSession} disabled={ending} style={{
          background: 'transparent',
          border: '1.5px solid rgba(255,107,107,0.4)',
          borderRadius: 12,
          color: '#FF6B6B', padding: '10px 20px',
          fontSize: 11, fontWeight: 800,
          fontFamily: 'Syne, sans-serif', cursor: 'pointer',
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          opacity: ending ? 0.6 : 1, transition: 'all 0.2s'
        }}>
          {ending ? '...' : (isEs ? 'Finalizar' : 'Finish')}
        </button>
      </div>

      {/* ── Tabs ejercicios ── */}
      {exercises.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' as const, padding: '0 20px 16px', scrollbarWidth: 'none' as const }}>
          {exercises.map((ex, i) => (
            <button key={ex.id} onClick={() => setCurrentExerciseIndex(i)} style={{
              background: i === currentExerciseIndex ? '#C8FF00' : 'rgba(255,255,255,0.04)',
              color: i === currentExerciseIndex ? '#0A0A0F' : '#8888AA',
              border: i === currentExerciseIndex ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '8px 16px',
              fontSize: 12, fontWeight: 700,
              fontFamily: 'Syne, sans-serif', cursor: 'pointer',
              whiteSpace: 'nowrap' as const, flexShrink: 0,
              transition: 'all 0.15s',
            }}>
              {ex.name.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
          <button onClick={() => setShowSearch(true)} style={{
            background: 'rgba(200,255,0,0.06)', color: '#C8FF00',
            border: '1px dashed rgba(200,255,0,0.35)',
            borderRadius: 10, padding: '8px 18px',
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Syne, sans-serif', cursor: 'pointer', flexShrink: 0,
            lineHeight: 1,
          }}>+</button>
        </div>
      )}

      {/* ── Contenido ── */}
      <div style={{ padding: '0 20px 120px' }}>
        {exercises.length === 0 ? (
          <div style={{ textAlign: 'center' as const, paddingTop: 80 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.08, lineHeight: 1, fontWeight: 700, color: '#C8FF00' }}>+</div>
            <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: '#F0F0F5', marginBottom: 8 }}>
              {isEs ? 'Sin ejercicios' : 'No exercises yet'}
            </p>
            <p style={{ fontSize: 14, color: '#44445a', marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
              {isEs ? 'Añade tu primer ejercicio' : 'Add your first exercise'}
            </p>
            <button onClick={() => setShowSearch(true)} style={{
              background: 'linear-gradient(135deg,#C8FF00,#88DD00)', color: '#0A0A0F',
              border: 'none', borderRadius: 16,
              padding: '18px 48px', fontSize: 16, fontWeight: 700,
              fontFamily: 'Syne, sans-serif', cursor: 'pointer',
              letterSpacing: '0.04em',
              boxShadow: '0 4px 20px rgba(200,255,0,0.3)',
            }}>+ {isEs ? 'Agregar ejercicio' : 'Add exercise'}</button>
          </div>
        ) : cur ? (
          <div>
            {/* Nombre y badge músculo */}
            <div style={{ marginBottom: 20, paddingTop: 4 }}>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 10, color: '#F0F0F5', letterSpacing: '-0.01em' }}>
                {cur.name}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase' as const, fontFamily: 'Syne, sans-serif',
                padding: '5px 12px', borderRadius: 8, display: 'inline-block',
                color: mc(cur.muscle_group_primary),
                background: mc(cur.muscle_group_primary) + '22',
                border: '1px solid ' + mc(cur.muscle_group_primary) + '44',
              }}>
                {cur.muscle_group_primary}
              </span>
            </div>

            {/* Series completadas */}
            {cur.sets.map((set, i) => (
              <CompletedSet
                key={set.id ?? i}
                set={set}
                exerciseIndex={currentExerciseIndex}
                setIndex={i}
                sessionId={activeSession?.id ?? sessionId}
              />
            ))}

            {/* Logger nueva serie */}
            {cur.session_exercise_id && (
              <SetLogger
                sessionId={activeSession?.id ?? sessionId}
                sessionExerciseId={cur.session_exercise_id}
                exerciseIndex={currentExerciseIndex}
                setNumber={cur.sets.length + 1}
                lastSet={cur.sets[cur.sets.length - 1] || null}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* ── Modal buscador ── */}
      {showSearch && (
        <div
          onClick={() => setShowSearch(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, margin: '0 auto',
              background: '#111118',
              borderRadius: '24px 24px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              maxHeight: '80vh',
              display: 'flex', flexDirection: 'column',
              animation: 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1) both',
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: '@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}' }} />
            {/* Handle */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
              margin: '12px auto 0',
              flexShrink: 0,
            }} />
            <div style={{ padding: '12px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: '#F0F0F5' }}>
                {isEs ? 'Añadir ejercicio' : 'Add exercise'}
              </p>
              <button onClick={() => setShowSearch(false)} style={{
                background: '#1a1a2e', border: 'none', color: '#8888AA',
                borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                fontSize: 13, fontFamily: 'Syne, sans-serif'
              }}>✕</button>
            </div>
            <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isEs ? 'Buscar: press banca, sentadilla...' : 'Search: bench press, squat...'}
                style={{
                  width: '100%',
                  background: '#0d0d14',
                  border: '1.5px solid ' + (inputFocus ? 'rgba(200,255,0,0.5)' : 'rgba(255,255,255,0.08)'),
                  borderRadius: 14,
                  color: '#F0F0F5',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
                  padding: '13px 16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={() => setInputFocus(true)}
                onBlur={() => setInputFocus(false)}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' as const, padding: '0 20px 48px' }}>
              {searching ? (
                <div style={{ textAlign: 'center' as const, padding: 40 }}>
                  <div style={{ width: 28, height: 28, border: '2px solid #C8FF00', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
                  <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
                </div>
              ) : results.length === 0 ? (
                <p style={{ textAlign: 'center' as const, color: '#44445a', padding: 40, fontFamily: 'Inter, sans-serif' }}>
                  {isEs ? 'Sin resultados' : 'No results'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {results.map(ex => (
                    <button key={ex.id} onClick={() => addEx(ex)} disabled={adding} style={{
                      background: '#16161f',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 14, padding: '14px 16px',
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer',
                      opacity: adding ? 0.5 : 1,
                      textAlign: 'left' as const,
                      transition: 'border-color 0.15s, background 0.15s',
                      width: '100%',
                    }}>
                      <div>
                        <p style={{ color: '#F0F0F5', fontSize: 15, fontWeight: 600, fontFamily: 'Syne, sans-serif', marginBottom: 3 }}>{ex.name}</p>
                        <span style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                          textTransform: 'uppercase' as const, fontFamily: 'Syne, sans-serif',
                          padding: '3px 8px', borderRadius: 5, display: 'inline-block',
                          color: mc(ex.muscle_group_primary),
                          background: mc(ex.muscle_group_primary) + '22',
                        }}>
                          {ex.muscle_group_primary}
                        </span>
                      </div>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(200,255,0,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#C8FF00', fontSize: 20, fontWeight: 700, flexShrink: 0
                      }}>+</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
