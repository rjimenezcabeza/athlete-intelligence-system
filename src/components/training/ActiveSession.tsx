'use client'

import { useState, useEffect, useRef } from 'react'
import { SetLogger } from './SetLogger'
import { QuickExerciseSelector } from './QuickExerciseSelector'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ExerciseInSession {
  sessionExerciseId: string
  exerciseId: string
  name: string
  setsTarget: number
  repRangeMin: number
  repRangeMax: number
  rirTarget?: number
  restSeconds: number
  orderInSession: number
}

interface LoggedSet {
  exerciseId: string
  setNumber: number
  weightKg: number
  reps: number
  rir?: number
  isWarmup: boolean
  timestamp: Date
}

interface ChatMessage {
  role: 'user' | 'coach'
  text: string
  ts: Date
}

const ACC = '#C8FF00'
const BG = '#0A0A0F'
const CARD = 'rgba(255,255,255,0.04)'
const BDR = 'rgba(255,255,255,0.08)'

// Quick-prompt chips shown in the chat drawer
const QUICK_PROMPTS = [
  '¿Puedo añadir más volumen hoy?',
  'Consejo técnico para el siguiente ejercicio',
  '¿Descanso suficiente entre series?',
  '¿Subo el peso o hago más reps?',
]

export function ActiveSession({ sessionId }: { sessionId: string }) {
  const [exercises, setExercises] = useState<ExerciseInSession[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentSetNumber, setCurrentSetNumber] = useState(1)
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([])
  const [sessionStart] = useState(new Date())
  const [isFinished, setIsFinished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)

  // ── AI Chat state ──────────────────────────────────────────────────
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  const router = useRouter()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSession() }, [sessionId])

  useEffect(() => {
    if (showChat) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [showChat])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadSession = async () => {
    const { data: session } = await (supabase as any)
      .from('training_sessions')
      .select(`
        *,
        session_exercises (
          id,
          order_in_session,
          exercise_id,
          template_exercise_id,
          exercises ( id, name ),
          template_exercises ( sets_target, rep_range_min, rep_range_max, rir_target, rest_seconds )
        )
      `)
      .eq('id', sessionId)
      .single()

    if (session?.session_exercises?.length > 0) {
      const exs: ExerciseInSession[] = session.session_exercises
        .sort((a: any, b: any) => a.order_in_session - b.order_in_session)
        .map((se: any) => ({
          sessionExerciseId: se.id,
          exerciseId: se.exercises.id,
          name: se.exercises.name,
          setsTarget: se.template_exercises?.sets_target ?? 3,
          repRangeMin: se.template_exercises?.rep_range_min ?? 8,
          repRangeMax: se.template_exercises?.rep_range_max ?? 12,
          rirTarget: se.template_exercises?.rir_target,
          restSeconds: se.template_exercises?.rest_seconds ?? 120,
          orderInSession: se.order_in_session,
        }))
      setExercises(exs)
    } else {
      setShowExerciseSelector(true)
    }
  }

  const handleAddExercise = async (exercise: { id: string; name: string }) => {
    const nextOrder = exercises.length + 1
    const { data: se, error } = await (supabase as any)
      .from('session_exercises')
      .insert({ session_id: sessionId, exercise_id: exercise.id, order_in_session: nextOrder })
      .select()
      .single()
    if (error || !se) return
    const newEx: ExerciseInSession = {
      sessionExerciseId: se.id,
      exerciseId: exercise.id,
      name: exercise.name,
      setsTarget: 3,
      repRangeMin: 8,
      repRangeMax: 12,
      rirTarget: 2,
      restSeconds: 120,
      orderInSession: nextOrder,
    }
    setExercises(prev => [...prev, newEx])
    setShowExerciseSelector(false)
    setCurrentIndex(exercises.length)
    setCurrentSetNumber(1)
  }

  const handleSetLogged = async (data: LoggedSet) => {
    const currentEx = exercises[currentIndex]
    if (!currentEx) return
    setLoggedSets(prev => [...prev, data])
    await (supabase as any).from('sets').insert({
      session_exercise_id: currentEx.sessionExerciseId,
      set_number: data.setNumber,
      set_type: data.isWarmup ? 'warmup' : 'working',
      weight_kg: data.weightKg,
      reps_completed: data.reps,
      rir_actual: data.rir ?? null,
    })
    const workingSetsForCurrent = loggedSets.filter(
      s => s.exerciseId === currentEx.exerciseId && !s.isWarmup
    ).length + (data.isWarmup ? 0 : 1)
    if (!data.isWarmup && workingSetsForCurrent >= currentEx.setsTarget) {
      if (currentIndex < exercises.length - 1) {
        setCurrentIndex(i => i + 1)
        setCurrentSetNumber(1)
      } else {
        setIsFinished(true)
      }
    } else if (!data.isWarmup) {
      setCurrentSetNumber(n => n + 1)
    }
  }

  const handleFinish = async () => {
    setIsSaving(true)
    await (supabase as any)
      .from('training_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId)
    setIsSaving(false)
    router.push('/dashboard')
  }

  // ── AI Chat ──────────────────────────────────────────────────────
  const buildContext = () => {
    const currentEx = exercises[currentIndex]
    const workingDone = loggedSets.filter(s => !s.isWarmup).length
    const elapsed = Math.floor((Date.now() - sessionStart.getTime()) / 60000)
    const lines: string[] = [
      `[CONTEXTO DE SESIÓN ACTIVA]`,
      `Ejercicio actual: ${currentEx?.name ?? 'N/A'} (${currentIndex + 1}/${exercises.length})`,
      `Series trabajadas hoy: ${workingDone}`,
      `Tiempo transcurrido: ${elapsed} min`,
    ]
    if (currentEx) {
      const setsForCurrent = loggedSets.filter(
        s => s.exerciseId === currentEx.exerciseId && !s.isWarmup
      )
      const last = setsForCurrent[setsForCurrent.length - 1]
      if (last) {
        lines.push(`Última serie: ${last.weightKg}kg × ${last.reps} reps${last.rir != null ? `, RIR ${last.rir}` : ''}`)
      }
      lines.push(`Objetivo: ${currentEx.setsTarget} series × ${currentEx.repRangeMin}-${currentEx.repRangeMax} reps, RIR ${currentEx.rirTarget ?? '?'}`)
    }
    return lines.join('\n')
  }

  const sendChatMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return
    const userMsg: ChatMessage = { role: 'user', text: text.trim(), ts: new Date() }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const context = buildContext()
      const question = `${context}\n\nPREGUNTA DEL ATLETA: ${text.trim()}`
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const reply = data.response ?? data.answer ?? data.message ?? '...'
      setChatMessages(prev => [...prev, { role: 'coach', text: reply, ts: new Date() }])
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'coach',
        text: 'No pude conectar con el coach. Inténtalo de nuevo.',
        ts: new Date()
      }])
    } finally {
      setChatLoading(false)
    }
  }

  // ── Derived ──────────────────────────────────────────────────────
  const elapsed = Math.floor((Date.now() - sessionStart.getTime()) / 60000)
  const currentEx = exercises[currentIndex]
  const workingSetsDone = loggedSets.filter(
    s => currentEx && s.exerciseId === currentEx.exerciseId && !s.isWarmup
  ).length

  // ── Early states ─────────────────────────────────────────────────
  if (showExerciseSelector && exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: BG }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: `1px solid ${BDR}` }}>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: 0 }}>Sesión libre</h1>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono,monospace', fontSize: 13 }}>{elapsed}min</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13, fontFamily: 'DM Mono,monospace', marginBottom: 24 }}>
            Añade el primer ejercicio para empezar
          </p>
          <QuickExerciseSelector onSelect={handleAddExercise} />
        </div>
      </div>
    )
  }

  if (isFinished) {
    const totalWorkingSets = loggedSets.filter(s => !s.isWarmup).length
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
        <div style={{ fontSize: 64 }}>🎯</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center', margin: 0 }}>¡Sesión completada!</h2>
        <div style={{ display: 'flex', gap: 24, textAlign: 'center' }}>
          {[
            { label: 'Series', value: totalWorkingSets },
            { label: 'Minutos', value: elapsed },
            { label: 'Ejercicios', value: exercises.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 32, fontWeight: 800, color: ACC, fontFamily: 'DM Mono,monospace', margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', margin: '4px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={handleFinish}
          disabled={isSaving}
          style={{ width: '100%', maxWidth: 360, padding: 18, borderRadius: 16, border: 'none', background: `linear-gradient(135deg,${ACC},#88DD00)`, color: BG, fontSize: 16, fontWeight: 800, cursor: isSaving ? 'not-allowed' : 'pointer' }}
        >
          {isSaving ? 'Guardando...' : 'Guardar y salir'}
        </button>
      </div>
    )
  }

  if (!currentEx) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${ACC}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const previousSets = loggedSets.filter(s => s.exerciseId === currentEx.exerciseId)
  const lastSet = previousSets[previousSets.length - 1]

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* ── Header ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${BDR}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACC, animation: 'pulse 2s infinite' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Mono,monospace', fontSize: 13 }}>{elapsed}min</span>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono,monospace' }}>
          {currentIndex + 1}/{exercises.length}
        </span>
        <button
          onClick={() => setIsFinished(true)}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono,monospace' }}
        >
          TERMINAR
        </button>
      </div>

      {/* ── Exercise pills ──────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto' }}>
        {exercises.map((ex, i) => {
          const done = loggedSets.filter(s => s.exerciseId === ex.exerciseId && !s.isWarmup).length >= ex.setsTarget
          return (
            <div
              key={ex.sessionExerciseId}
              style={{
                flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontFamily: 'DM Mono,monospace',
                border: `1px solid ${done ? `${ACC}50` : i === currentIndex ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                background: done ? `${ACC}20` : i === currentIndex ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: done ? ACC : i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            >
              {done ? '✓ ' : ''}{ex.name.split(' ')[0]}
            </div>
          )
        })}
        <button
          onClick={() => setShowExerciseSelector(true)}
          style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontFamily: 'DM Mono,monospace', border: `1px dashed rgba(255,255,255,0.2)`, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
        >
          + ejercicio
        </button>
      </div>

      {/* ── Set progress bars ───────────────────────── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
        {Array.from({ length: currentEx.setsTarget }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 6, flex: 1, borderRadius: 3,
              background: i < workingSetsDone ? ACC : i === workingSetsDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* ── Main content ────────────────────────────── */}
      <div style={{ flex: 1, padding: '0 16px 120px' }}>
        {showExerciseSelector ? (
          <div style={{ borderRadius: 16, background: CARD, border: `1px solid ${BDR}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${BDR}` }}>
              <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: 14 }}>Añadir ejercicio</p>
              <button
                onClick={() => setShowExerciseSelector(false)}
                style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
              >✕</button>
            </div>
            <QuickExerciseSelector onSelect={handleAddExercise} />
          </div>
        ) : (
          <SetLogger
            key={`${currentEx.sessionExerciseId}-${currentSetNumber}`}
            exerciseId={currentEx.exerciseId}
            exerciseName={currentEx.name}
            setNumber={currentSetNumber}
            previousWeight={lastSet?.weightKg}
            previousReps={lastSet?.reps}
            onSetLogged={handleSetLogged}
            onSkip={
              currentIndex < exercises.length - 1
                ? () => { setCurrentIndex(i => i + 1); setCurrentSetNumber(1) }
                : undefined
            }
          />
        )}
      </div>

      {/* ── Floating AI Chat button ──────────────────── */}
      <button
        onClick={() => setShowChat(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 20, zIndex: 50,
          width: 52, height: 52, borderRadius: '50%',
          background: showChat ? '#333' : `linear-gradient(135deg,${ACC},#88DD00)`,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px ${showChat ? 'rgba(0,0,0,0.4)' : `${ACC}40`}`,
          fontSize: 22, transition: 'all 0.2s',
        }}
        title="AI Coach"
      >
        {showChat ? '✕' : '🤖'}
      </button>

      {/* ── AI Chat drawer ───────────────────────────── */}
      {showChat && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
            background: '#111118', borderTop: `1px solid ${BDR}`,
            borderRadius: '20px 20px 0 0',
            display: 'flex', flexDirection: 'column',
            maxHeight: '60vh', minHeight: 320,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            animation: 'slideUp 0.25s ease',
          }}
        >
          {/* Drawer handle + header */}
          <div style={{ padding: '10px 16px 12px', borderBottom: `1px solid ${BDR}`, flexShrink: 0 }}>
            <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Syne,sans-serif' }}>AI Coach</p>
                <p style={{ margin: 0, fontSize: 10, color: '#555', fontFamily: 'DM Mono,monospace' }}>
                  {currentEx.name} · serie {currentSetNumber}/{currentEx.setsTarget}
                </p>
              </div>
            </div>
          </div>

          {/* Message list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chatMessages.length === 0 && (
              <>
                <p style={{ textAlign: 'center', fontSize: 12, color: '#444', fontFamily: 'DM Mono,monospace', margin: '8px 0 12px' }}>
                  Pregúntame lo que necesites durante el entrenamiento
                </p>
                {/* Quick prompts */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {QUICK_PROMPTS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendChatMessage(q)}
                      style={{
                        padding: '6px 10px', borderRadius: 20, fontSize: 11,
                        border: `1px solid ${BDR}`, background: CARD,
                        color: '#aaa', cursor: 'pointer', fontFamily: 'DM Mono,monospace',
                        textAlign: 'left',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
                    fontSize: 13, lineHeight: 1.5, fontFamily: 'Syne,sans-serif',
                    background: msg.role === 'user' ? ACC : CARD,
                    color: msg.role === 'user' ? '#0A0A0F' : '#ddd',
                    border: msg.role === 'coach' ? `1px solid ${BDR}` : 'none',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: CARD, border: `1px solid ${BDR}` }}>
                  <span style={{ fontSize: 20, animation: 'pulse 1s infinite' }}>●●●</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 16px 16px', borderTop: `1px solid ${BDR}`, flexShrink: 0, display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(chatInput) } }}
              placeholder="Pregunta al coach..."
              disabled={chatLoading}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${BDR}`,
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'Syne,sans-serif',
              }}
            />
            <button
              onClick={() => sendChatMessage(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                width: 42, height: 42, borderRadius: 12, border: 'none',
                background: chatInput.trim() ? ACC : 'rgba(255,255,255,0.05)',
                color: chatInput.trim() ? '#0A0A0F' : '#333',
                fontSize: 18, cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
