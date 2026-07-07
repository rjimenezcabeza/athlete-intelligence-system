'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { SetLogger, CompletedSet } from './SetLogger'
import { LastPerformanceBadge } from '@/components/workout/LastPerformanceBadge'
import { useTheme } from '@/components/providers/ThemeProvider'

interface ActiveSessionProps { sessionId: string; locale: string }
interface ExResult { id: string; name: string; muscle_group_primary: string; slug: string }

const MC: Record<string, string> = {
  chest: '#FF6B6B', back: '#4ECDC4', shoulders: '#A78BFA', arms: '#FBBF24',
  legs: '#60A5FA', core: '#F97316', glutes: '#EC4899', calves: '#10B981',
  'deltoides lateral': '#A78BFA', 'pecho': '#FF6B6B',
  'espalda': '#4ECDC4', 'hombros': '#A78BFA', 'bíceps': '#FBBF24',
  'tríceps': '#FBBF24', 'piernas': '#60A5FA', 'glúteos': '#EC4899',
  'abdominales': '#F97316', 'pantorrillas': '#10B981',
}
const mc = (m: string) => MC[m?.toLowerCase()] ?? '#8888AA'

const T1 = 'var(--text-primary)'
const T2 = 'var(--text-secondary)'
const T3 = 'var(--text-tertiary)'
const CARD = 'var(--card-bg)'
const BORDER = 'var(--card-border)'

const REST_PRESETS = [60, 90, 120, 180]

export function ActiveSession({ sessionId, locale }: ActiveSessionProps) {
  const router = useRouter()
  const { accentColor } = useTheme()
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

  // Custom exercise creation
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createMuscle, setCreateMuscle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  // AI Companion
  const [aiMessage, setAiMessage] = useState<string|null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [coachLog, setCoachLog] = useState<string[]>([])
  const [showCoachLog, setShowCoachLog] = useState(false)
  const aiDismissTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  // Rest timer
  const [restActive, setRestActive] = useState(false)
  const [restRemaining, setRestRemaining] = useState(0)
  const [restTotal, setRestTotal] = useState(120)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Load session metadata + rehydrate exercises from DB
    Promise.all([
      fetch('/api/sessions/active').then(r => r.json()),
      fetch('/api/sessions/' + sessionId + '/load').then(r => r.json()),
    ]).then(([activeData, loadData]) => {
      if (activeData.session) setActiveSession(activeData.session)
      if (loadData.exercises && loadData.exercises.length > 0 && exercises.length === 0) {
        loadData.exercises.forEach((ex: any, i: number) => {
          addExercise({
            id: ex.exercise_id,
            session_exercise_id: ex.id,
            exercise_id: ex.exercise_id,
            name: ex.exercises?.name ?? '',
            muscle_group_primary: ex.exercises?.muscle_group_primary ?? '',
            slug: ex.exercises?.slug ?? '',
            order_in_session: ex.order_in_session ?? i,
            sets: (ex.sets ?? []).map((s: any) => ({
              id: s.id,
              set_number: s.set_number,
              set_type: s.set_type,
              weight_kg: s.weight_kg,
              reps_completed: s.reps_completed,
              rir_actual: s.rir_actual,
              rpe_actual: s.rpe_actual,
              notes: s.notes,
              logged_at: s.logged_at,
            }))
          })
        })
        setCurrentExerciseIndex(0)
      }
    }).catch(() => {})
  }, [sessionId])

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

  // Rest timer logic
  const startRest = useCallback((seconds: number) => {
    setRestTotal(seconds)
    setRestRemaining(seconds)
    setRestActive(true)
    if (restRef.current) clearInterval(restRef.current)
    restRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev <= 1) {
          clearInterval(restRef.current!)
          setRestActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const skipRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current)
    setRestActive(false)
    setRestRemaining(0)
  }, [])

  useEffect(() => { return () => { if (restRef.current) clearInterval(restRef.current) } }, [])
  useEffect(() => { return () => { if (aiDismissTimer.current) clearTimeout(aiDismissTimer.current) } }, [])

  // AI Companion — react to each set logged
  const getAiReaction = useCallback(async (setsCount: number, exerciseName: string, lastSet: any, allExSets: any[]) => {
    if (!lastSet) return
    setAiLoading(true)
    setAiMessage(null)
    try {
      const res = await fetch('/api/ai/session-set', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName,
          weightKg: lastSet.weight_kg,
          reps: lastSet.reps_completed,
          rir: lastSet.rir_actual,
          setNumber: lastSet.set_number ?? setsCount,
          locale,
          previousSets: allExSets.slice(0, -1),
          totalSetsToday: setsCount,
        })
      })
      const data = await res.json()
      const msg = data.message ?? null
      if (msg) {
        setAiMessage(msg.trim())
        setCoachLog(prev => [msg.trim(), ...prev].slice(0, 6))
        if (aiDismissTimer.current) clearTimeout(aiDismissTimer.current)
        aiDismissTimer.current = setTimeout(() => setAiMessage(null), 10000)
      }
    } catch {}
    setAiLoading(false)
  }, [locale])

  // Auto-trigger rest + AI reaction when a new set is logged
  const prevSetsCount = useRef(0)
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0)
  useEffect(() => {
    if (totalSets > prevSetsCount.current) {
      if (prevSetsCount.current > 0) startRest(restTotal)
      // Get last logged set for AI reaction
      const lastEx = [...exercises].reverse().find(e => e.sets.length > 0)
      if (lastEx) {
        const lastSet = lastEx.sets[lastEx.sets.length - 1]
        if (lastSet) getAiReaction(totalSets, lastEx.name, lastSet, lastEx.sets)
      }
    }
    prevSetsCount.current = totalSets
  }, [totalSets, startRest, restTotal, getAiReaction, exercises])

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

  const createAndAdd = async () => {
    if (!createName.trim() || !createMuscle.trim()) return
    setCreating(true); setCreateErr('')
    try {
      const res = await fetch('/api/exercises/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim(), muscle_group_primary: createMuscle.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await addEx({ id: data.exercise.id, name: data.exercise.name, muscle_group_primary: data.exercise.muscle_group_primary, slug: data.exercise.slug })
      setShowCreate(false); setCreateName(''); setCreateMuscle('')
    } catch (e) { setCreateErr(e instanceof Error ? e.message : String(e)) }
    setCreating(false)
  }

  const endSession = async () => {
    if (ending) return
    setEnding(true)
    try {
      // Always use sessionId from URL params — activeSession may not be loaded yet
      const res = await fetch('/api/sessions/' + sessionId + '/end', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('end failed')
      clearSession()
      router.push('/' + locale + '/session/' + sessionId + '/feedback')
    } catch (e) {
      console.error(e)
      setEnding(false)
    }
  }

  const cur = exercises[currentExerciseIndex]
  const totalVolume = exercises.reduce((a, e) => a + e.sets.reduce((b: number, s: any) => b + ((s.weight_kg || 0) * (s.reps_completed || 0)), 0), 0)
  const restPct = restActive ? ((restTotal - restRemaining) / restTotal) * 100 : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: T1, maxWidth: 480, margin: '0 auto' }}>

      {/* ── Header: timer + finish ── */}
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', position: 'sticky' as const, top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: accentColor, fontSize: 34, fontWeight: 700, fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em', lineHeight: 1 }}>
              {fmt(elapsed)}
            </div>
            <div style={{ color: T3, fontSize: 11, fontFamily: 'Syne, sans-serif', marginTop: 3, letterSpacing: '0.06em', display: 'flex', gap: 8 }}>
              <span>{exercises.length} {isEs ? 'ejercicios' : 'exercises'}</span>
              <span>·</span>
              <span>{totalSets} {isEs ? 'series' : 'sets'}</span>
              {totalVolume > 0 && <>
                <span>·</span>
                <span>{Math.round(totalVolume)}kg {isEs ? 'vol.' : 'vol.'}</span>
              </>}
            </div>
          </div>
          <button onClick={endSession} disabled={ending} style={{
            background: 'transparent', border: '1.5px solid rgba(255,107,107,0.45)',
            borderRadius: 12, color: '#FF6B6B', padding: '10px 18px',
            fontSize: 11, fontWeight: 800, fontFamily: 'Syne, sans-serif',
            cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            opacity: ending ? 0.6 : 1, transition: 'all 0.2s',
          }}>
            {ending ? '...' : (isEs ? 'Finalizar' : 'Finish')}
          </button>
        </div>
      </div>

      {/* ── Rest timer banner ── */}
      {restActive && (
        <div style={{
          background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`,
          borderBottom: `2px solid ${accentColor}40`,
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 2 }}>
              {isEs ? '⏱ DESCANSO' : '⏱ REST'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: accentColor, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
              {fmt(restRemaining)}
            </div>
          </div>
          <svg width={44} height={44} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx={22} cy={22} r={18} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
            <circle cx={22} cy={22} r={18} fill="none" stroke={accentColor} strokeWidth={4}
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - restPct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <button onClick={skipRest} style={{
            padding: '9px 16px', background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${BORDER}`, borderRadius: 10,
            color: T2, fontSize: 11, fontWeight: 700,
            fontFamily: 'Syne, sans-serif', cursor: 'pointer',
          }}>{isEs ? 'Saltar' : 'Skip'}</button>
        </div>
      )}

      {/* ── AI Companion ── */}
      {(aiLoading || aiMessage || coachLog.length > 0) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(167,139,250,0.02))',
          borderBottom: '1px solid rgba(167,139,250,0.15)',
        }}>
          {/* Current / loading message */}
          <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 48 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, boxShadow: '0 2px 8px rgba(167,139,250,0.35)',
            }}>🧠</div>
            {aiLoading ? (
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', paddingTop: 6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#A78BFA',
                    animation: `coachPulse 1.2s ease-in-out ${i*0.18}s infinite`,
                  }}/>
                ))}
                <style>{`@keyframes coachPulse{0%,80%,100%{opacity:0.25;transform:scale(0.85)}40%{opacity:1;transform:scale(1.15)}}`}</style>
              </div>
            ) : aiMessage ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#DDD6FE', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, paddingTop: 3 }}>
                  {aiMessage}
                </p>
                <button onClick={() => setAiMessage(null)} style={{
                  background: 'none', border: 'none', color: 'rgba(167,139,250,0.35)',
                  cursor: 'pointer', fontSize: 15, padding: '2px 0', flexShrink: 0,
                  lineHeight: 1, transition: 'color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(167,139,250,0.35)')}
                >✕</button>
              </div>
            ) : coachLog.length > 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 3 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(167,139,250,0.5)', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
                  {isEs ? 'Coach listo para la siguiente serie' : 'Coach ready for next set'}
                </p>
                {coachLog.length > 1 && (
                  <button onClick={() => setShowCoachLog(v => !v)} style={{
                    background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: 8, color: '#A78BFA', cursor: 'pointer',
                    fontSize: 10, fontWeight: 700, fontFamily: 'Syne, sans-serif',
                    padding: '4px 10px', whiteSpace: 'nowrap', letterSpacing: '0.05em',
                  }}>{showCoachLog ? '▲' : `▼ ${isEs ? 'Ver log' : 'Log'} (${coachLog.length})`}</button>
                )}
              </div>
            ) : null}
          </div>
          {/* Coach log — last N messages */}
          {showCoachLog && coachLog.length > 1 && (
            <div style={{ borderTop: '1px solid rgba(167,139,250,0.1)', padding: '8px 20px 12px 58px' }}>
              {coachLog.slice(1).map((msg, i) => (
                <p key={i} style={{
                  margin: '0 0 6px', fontSize: 11, lineHeight: 1.4,
                  color: `rgba(196,181,253,${0.55 - i * 0.1})`,
                  fontFamily: 'Inter, sans-serif',
                  borderLeft: '2px solid rgba(167,139,250,0.15)', paddingLeft: 10,
                }}>{msg}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Rest presets (idle) ── */}
      {!restActive && totalSets > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 20px', borderBottom: `1px solid ${BORDER}`, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono, monospace', marginRight: 4, whiteSpace: 'nowrap' as const }}>
            {isEs ? 'Descanso:' : 'Rest:'}
          </span>
          {REST_PRESETS.map(s => (
            <button key={s} onClick={() => { setRestTotal(s); startRest(s) }} style={{
              padding: '5px 10px',
              background: restTotal === s ? accentColor + '20' : 'transparent',
              border: `1px solid ${restTotal === s ? accentColor + '60' : BORDER}`,
              borderRadius: 8, color: restTotal === s ? accentColor : T3,
              fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono, monospace',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{s < 60 ? `${s}s` : `${s / 60}m`}</button>
          ))}
        </div>
      )}

      {/* ── Exercise tabs ── */}
      {exercises.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' as const, padding: '12px 20px 0', scrollbarWidth: 'none' as const }}>
          {exercises.map((ex, i) => (
            <button key={ex.id + i} onClick={() => setCurrentExerciseIndex(i)} style={{
              background: i === currentExerciseIndex ? accentColor : 'rgba(255,255,255,0.04)',
              color: i === currentExerciseIndex ? '#0A0A0F' : T3,
              border: i === currentExerciseIndex ? 'none' : `1px solid ${BORDER}`,
              borderRadius: 10, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, fontFamily: 'Syne, sans-serif',
              cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0,
              transition: 'all 0.15s', position: 'relative' as const,
            }}>
              {ex.name.split(' ').slice(0, 2).join(' ')}
              {ex.sets.length > 0 && (
                <span style={{
                  position: 'absolute' as const, top: -5, right: -5,
                  width: 16, height: 16, borderRadius: '50%',
                  background: i === currentExerciseIndex ? 'rgba(0,0,0,0.5)' : accentColor,
                  color: '#0A0A0F', fontSize: 8, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'DM Mono, monospace',
                }}>{ex.sets.length}</span>
              )}
            </button>
          ))}
          <button onClick={() => setShowSearch(true)} style={{
            background: `${accentColor}10`, color: accentColor,
            border: `1px dashed ${accentColor}40`,
            borderRadius: 10, padding: '7px 16px',
            fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0, lineHeight: 1,
          }}>+</button>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ padding: '16px 20px 140px' }}>
        {exercises.length === 0 ? (
          <div style={{ textAlign: 'center' as const, paddingTop: 80 }}>
            <div style={{ fontSize: 80, lineHeight: 1, color: accentColor, opacity: 0.07, fontWeight: 800, marginBottom: 20 }}>+</div>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: T1, marginBottom: 8 }}>
              {isEs ? 'Sin ejercicios' : 'No exercises yet'}
            </p>
            <p style={{ fontSize: 14, color: T3, marginBottom: 36, fontFamily: 'Inter, sans-serif' }}>
              {isEs ? 'Añade tu primer ejercicio para comenzar' : 'Add your first exercise to begin'}
            </p>
            <button onClick={() => setShowSearch(true)} style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              color: '#0A0A0F', border: 'none', borderRadius: 16,
              padding: '16px 40px', fontSize: 16, fontWeight: 700,
              fontFamily: 'Syne, sans-serif', cursor: 'pointer', letterSpacing: '0.04em',
              boxShadow: `0 4px 20px ${accentColor}30`,
            }}>+ {isEs ? 'Agregar ejercicio' : 'Add exercise'}</button>
          </div>
        ) : cur ? (
          <div>
            {/* Exercise header */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 8, color: T1 }}>{cur.name}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  fontFamily: 'Syne, sans-serif', padding: '4px 10px', borderRadius: 7,
                  color: mc(cur.muscle_group_primary), background: mc(cur.muscle_group_primary) + '22',
                  border: `1px solid ${mc(cur.muscle_group_primary)}44`,
                }}>{cur.muscle_group_primary}</span>
                {cur.sets.length > 0 && (
                  <span style={{ fontSize: 12, color: T3, fontFamily: 'DM Mono, monospace' }}>
                    {cur.sets.length} {isEs ? 'series' : 'sets'} · {Math.round(cur.sets.reduce((a: number, s: any) => a + ((s.weight_kg || 0) * (s.reps_completed || 0)), 0))}kg
                  </span>
                )}
              </div>
            </div>

            <LastPerformanceBadge exerciseId={cur.id} locale={locale} />

            {cur.sets.map((set: any, i: number) => (
              <CompletedSet key={set.id ?? i} set={set} exerciseIndex={currentExerciseIndex}
                setIndex={i} sessionId={activeSession?.id ?? sessionId} />
            ))}

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

      {/* ── Exercise search modal ── */}
      {showSearch && (
        <div onClick={() => setShowSearch(false)} style={{
          position: 'fixed' as const, inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 480, margin: '0 auto',
            background: '#111118', borderRadius: '24px 24px 0 0',
            border: `1px solid ${BORDER}`, borderBottom: 'none',
            maxHeight: '82vh', display: 'flex', flexDirection: 'column' as const,
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', margin: '10px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: T1 }}>
                {isEs ? 'Añadir ejercicio' : 'Add exercise'}
              </p>
              <button onClick={() => setShowSearch(false)} style={{
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`,
                color: T2, borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                fontSize: 13, fontFamily: 'Syne, sans-serif'
              }}>✕</button>
            </div>
            <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={isEs ? 'press banca, sentadilla...' : 'bench press, squat...'}
                style={{
                  width: '100%', background: '#0d0d14',
                  border: `1.5px solid ${inputFocus ? accentColor + '60' : BORDER}`,
                  borderRadius: 14, color: T1, fontFamily: 'Inter, sans-serif',
                  fontSize: 15, padding: '13px 16px', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
                }}
                onFocus={() => setInputFocus(true)} onBlur={() => setInputFocus(false)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' as const, padding: '0 20px 12px' }}>
              {searching ? (
                <div style={{ textAlign: 'center' as const, padding: 40 }}>
                  <div style={{ width: 28, height: 28, border: `2px solid ${accentColor}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
                  <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
                </div>
              ) : results.length === 0 ? (
                <div style={{ textAlign: 'center' as const, padding: '30px 0 16px', fontFamily: 'Inter, sans-serif', color: T3, fontSize: 14 }}>
                  {isEs ? 'Sin resultados' : 'No results'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {results.map(ex => (
                    <button key={ex.id} onClick={() => addEx(ex)} disabled={adding} style={{
                      background: '#16161f', border: `1px solid ${BORDER}`,
                      borderRadius: 14, padding: '14px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', opacity: adding ? 0.5 : 1, textAlign: 'left' as const,
                      width: '100%',
                    }}>
                      <div>
                        <p style={{ color: T1, fontSize: 15, fontWeight: 600, fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>{ex.name}</p>
                        <span style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                          textTransform: 'uppercase' as const, fontFamily: 'Syne, sans-serif',
                          padding: '3px 8px', borderRadius: 5,
                          color: mc(ex.muscle_group_primary), background: mc(ex.muscle_group_primary) + '22',
                        }}>{ex.muscle_group_primary}</span>
                      </div>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: `${accentColor}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: accentColor, fontSize: 20, fontWeight: 700, flexShrink: 0
                      }}>+</div>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Create custom exercise ── */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                {!showCreate ? (
                  <button onClick={() => { setShowCreate(true); setCreateName(query); setCreateErr('') }} style={{
                    width: '100%', background: 'transparent',
                    border: `1.5px dashed ${accentColor}40`,
                    borderRadius: 14, padding: '13px 16px',
                    color: accentColor, fontSize: 13, fontWeight: 700,
                    fontFamily: 'Syne, sans-serif', cursor: 'pointer',
                    letterSpacing: '0.04em', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                    <span style={{ fontSize: 16 }}>✦</span>
                    {isEs ? 'Crear ejercicio personalizado' : 'Create custom exercise'}
                  </button>
                ) : (
                  <div style={{ background: '#0d0d14', border: `1px solid ${accentColor}30`, borderRadius: 16, padding: 16 }}>
                    <p style={{ color: accentColor, fontSize: 11, fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                      ✦ {isEs ? 'Nuevo ejercicio' : 'New exercise'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                      <input
                        type="text" value={createName} onChange={e => setCreateName(e.target.value)}
                        placeholder={isEs ? 'Nombre del ejercicio...' : 'Exercise name...'}
                        style={{
                          width: '100%', background: '#16161f', border: `1.5px solid ${BORDER}`,
                          borderRadius: 10, color: T1, fontFamily: 'Inter, sans-serif',
                          fontSize: 14, padding: '11px 14px', outline: 'none', boxSizing: 'border-box' as const
                        }} />
                      <input
                        type="text" value={createMuscle} onChange={e => setCreateMuscle(e.target.value)}
                        placeholder={isEs ? 'Grupo muscular (ej: pecho, espalda...)' : 'Muscle group (e.g. chest, back...)'}
                        style={{
                          width: '100%', background: '#16161f', border: `1.5px solid ${BORDER}`,
                          borderRadius: 10, color: T1, fontFamily: 'Inter, sans-serif',
                          fontSize: 14, padding: '11px 14px', outline: 'none', boxSizing: 'border-box' as const
                        }} />
                      {createErr && <p style={{ color: '#FF6B6B', fontSize: 12, fontFamily: 'Inter, sans-serif', margin: 0 }}>{createErr}</p>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setShowCreate(false); setCreateErr('') }} style={{
                          flex: 1, background: 'transparent', border: `1px solid ${BORDER}`,
                          borderRadius: 10, padding: '11px 0', color: T3, fontSize: 12,
                          fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer',
                        }}>{isEs ? 'Cancelar' : 'Cancel'}</button>
                        <button onClick={createAndAdd} disabled={creating || !createName.trim() || !createMuscle.trim()} style={{
                          flex: 2, background: creating ? '#1a1a2e' : `linear-gradient(135deg,${accentColor},${accentColor}cc)`,
                          border: 'none', borderRadius: 10, padding: '11px 0',
                          color: '#0A0A0F', fontSize: 13, fontWeight: 800,
                          fontFamily: 'Syne, sans-serif', cursor: 'pointer',
                          opacity: (!createName.trim() || !createMuscle.trim()) ? 0.4 : 1,
                        }}>
                          {creating ? '...' : (isEs ? '+ Crear y añadir' : '+ Create & add')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ height: 32 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
