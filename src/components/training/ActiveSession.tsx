'use client'

import { useState, useEffect } from 'react'
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

export function ActiveSession({ sessionId }: { sessionId: string }) {
  const [exercises, setExercises] = useState<ExerciseInSession[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentSetNumber, setCurrentSetNumber] = useState(1)
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([])
  const [sessionStart] = useState(new Date())
  const [isFinished, setIsFinished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSession() }, [sessionId])

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
      .insert({
        session_id: sessionId,
        exercise_id: exercise.id,
        order_in_session: nextOrder,
      })
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

  const elapsed = Math.floor((Date.now() - sessionStart.getTime()) / 60000)
  const currentEx = exercises[currentIndex]
  const workingSetsDone = loggedSets.filter(
    s => currentEx && s.exerciseId === currentEx.exerciseId && !s.isWarmup
  ).length

  if (showExerciseSelector && exercises.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <h1 className="text-white font-bold text-lg">Sesión libre</h1>
          <span className="text-white/40 font-mono text-sm">{elapsed}min</span>
        </div>
        <div className="flex-1 flex flex-col justify-center px-4">
          <p className="text-white/50 text-center text-sm font-mono mb-6">
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
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-6xl">🎯</div>
        <h2 className="text-2xl font-bold text-white text-center">¡Sesión completada!</h2>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-[#C8FF00] font-mono">{totalWorkingSets}</p>
            <p className="text-xs text-white/40 font-mono uppercase">Series</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#C8FF00] font-mono">{elapsed}</p>
            <p className="text-xs text-white/40 font-mono uppercase">Minutos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#C8FF00] font-mono">{exercises.length}</p>
            <p className="text-xs text-white/40 font-mono uppercase">Ejercicios</p>
          </div>
        </div>
        <button
          onClick={handleFinish}
          disabled={isSaving}
          className="w-full max-w-sm py-4 rounded-2xl bg-[#C8FF00] text-black font-bold text-lg disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar y salir'}
        </button>
      </div>
    )
  }

  if (!currentEx) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const previousSets = loggedSets.filter(s => s.exerciseId === currentEx.exerciseId)
  const lastSet = previousSets[previousSets.length - 1]

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" />
          <span className="text-white/60 font-mono text-sm">{elapsed}min</span>
        </div>
        <span className="text-xs text-white/30 font-mono">
          {currentIndex + 1}/{exercises.length}
        </span>
        <button
          onClick={() => setIsFinished(true)}
          className="text-xs text-white/30 hover:text-white/60 font-mono transition-colors"
        >
          TERMINAR
        </button>
      </div>

      {/* Exercise pills */}
      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-none">
        {exercises.map((ex, i) => {
          const done = loggedSets.filter(
            s => s.exerciseId === ex.exerciseId && !s.isWarmup
          ).length >= ex.setsTarget
          return (
            <div key={ex.sessionExerciseId} className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-mono transition-all ${
              done
                ? 'bg-[#C8FF00]/20 text-[#C8FF00] border border-[#C8FF00]/30'
                : i === currentIndex
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-white/30 border border-white/10'
            }`}>
              {done ? '✓ ' : ''}{ex.name.split(' ')[0]}
            </div>
          )
        })}
        <button
          onClick={() => setShowExerciseSelector(true)}
          className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-mono bg-white/5 text-white/30 border border-dashed border-white/20 hover:border-[#C8FF00]/40 hover:text-[#C8FF00]/60 transition-all"
        >
          + ejercicio
        </button>
      </div>

      {/* Set progress bars */}
      <div className="flex gap-2 px-4 pb-3">
        {Array.from({ length: currentEx.setsTarget }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
            i < workingSetsDone ? 'bg-[#C8FF00]'
            : i === workingSetsDone ? 'bg-white/40'
            : 'bg-white/10'
          }`} />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-8">
        {showExerciseSelector ? (
          <div className="rounded-2xl bg-[#111118] border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-white font-semibold">Añadir ejercicio</p>
              <button
                onClick={() => setShowExerciseSelector(false)}
                className="text-white/40 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
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
    </div>
  )
}
