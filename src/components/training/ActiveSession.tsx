'use client'

import { useState, useEffect } from 'react'
import { SetLogger, type SetData } from './SetLogger'
import { QuickExerciseSelector } from './QuickExerciseSelector'
import { createClient } from '@/lib/supabase/client'

// sessionExerciseId: FK en tabla session_exercises (requerido para insertar en sets)
interface Exercise {
  sessionExerciseId: string
  id: string
  name: string
  sets_target: number
  reps_min: number
  reps_max: number
  rir_target?: number
}

interface LoggedSet extends SetData {}

interface ActiveSessionProps {
  sessionId: string
}

export function ActiveSession({ sessionId }: ActiveSessionProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetNumber, setCurrentSetNumber] = useState(1)
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([])
  const [sessionStartTime] = useState(new Date())
  const [isFinished, setIsFinished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const loadSession = async () => {
    // session_exercises no tiene sets_target/reps — vienen de template_exercises vía FK
    const { data: session } = await (supabase as any)
      .from('training_sessions')
      .select(`
        *,
        session_exercises (
          id,
          order_in_session,
          exercises (id, name),
          template_exercises (
            sets_target,
            rep_range_min,
            rep_range_max,
            rir_target
          )
        )
      `)
      .eq('id', sessionId)
      .single()

    if (session?.session_exercises?.length > 0) {
      const exs = session.session_exercises
        .sort((a: any, b: any) => (a.order_in_session ?? 0) - (b.order_in_session ?? 0))
        .map((se: any) => ({
          sessionExerciseId: se.id,
          id: se.exercises.id,
          name: se.exercises.name,
          sets_target: se.template_exercises?.sets_target ?? 3,
          reps_min: se.template_exercises?.rep_range_min ?? 8,
          reps_max: se.template_exercises?.rep_range_max ?? 12,
          rir_target: se.template_exercises?.rir_target,
        }))
      setExercises(exs)
    } else {
      // Sesión libre sin template — mostrar selector
      setShowExerciseSelector(true)
    }
  }

  const handleAddExercise = async (exercise: { id: string; name: string }) => {
    // Crear session_exercise en BD
    const { data: se, error } = await (supabase as any)
      .from('session_exercises')
      .insert({
        session_id: sessionId,
        exercise_id: exercise.id,
        order_in_session: exercises.length + 1,
      })
      .select()
      .single()

    if (error || !se) return

    setExercises(prev => [...prev, {
      sessionExerciseId: se.id,
      id: exercise.id,
      name: exercise.name,
      sets_target: 3,
      reps_min: 8,
      reps_max: 12,
    }])
    setShowExerciseSelector(false)
  }

  const currentExercise = exercises[currentExerciseIndex]

  const setsForCurrentExercise = loggedSets.filter(
    (s) => s.exerciseId === currentExercise?.id
  )

  const handleSetLogged = async (data: LoggedSet) => {
    setLoggedSets(prev => [...prev, data])

    // sets usa set_type enum, NO is_warmup; session_exercise_id (no session_id)
    await (supabase as any).from('sets').insert({
      session_exercise_id: currentExercise.sessionExerciseId,
      set_number: data.setNumber,
      set_type: data.isWarmup ? 'warmup' : 'working',
      weight_kg: data.weightKg,
      reps_completed: data.reps,
      rir_actual: data.rir ?? null,
    })

    if (currentSetNumber >= currentExercise.sets_target) {
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(i => i + 1)
        setCurrentSetNumber(1)
      } else {
        setIsFinished(true)
      }
    } else {
      setCurrentSetNumber(n => n + 1)
    }
  }

  const handleFinishSession = async () => {
    setIsSaving(true)
    await (supabase as any)
      .from('training_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId)
    setIsSaving(false)
    const locale = window.location.pathname.split('/')[1] || 'es'
    window.location.href = `/${locale}/dashboard`
  }

  const elapsedMinutes = Math.floor(
    (Date.now() - sessionStartTime.getTime()) / 60000
  )

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-6xl">🎯</div>
        <h2 className="text-2xl font-bold text-white text-center">
          ¡Sesión completada!
        </h2>
        <p className="text-white/40 font-mono text-sm text-center">
          {loggedSets.filter((s) => !s.isWarmup).length} series · {elapsedMinutes} minutos
        </p>
        <button
          onClick={handleFinishSession}
          disabled={isSaving}
          className="w-full max-w-sm py-4 rounded-2xl bg-[#C8FF00] text-black font-bold text-lg disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar y salir'}
        </button>
      </div>
    )
  }

  if (showExerciseSelector) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-white font-semibold">Añadir ejercicio</p>
          {exercises.length > 0 && (
            <button
              onClick={() => setShowExerciseSelector(false)}
              className="text-xs text-[#C8FF00] font-mono"
            >
              LISTO
            </button>
          )}
        </div>
        <QuickExerciseSelector onSelect={handleAddExercise} />
      </div>
    )
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" />
          <span className="text-white/60 font-mono text-sm">{elapsedMinutes}min</span>
        </div>
        <p className="text-xs text-white/30 font-mono uppercase tracking-widest">
          Ejercicio {currentExerciseIndex + 1}/{exercises.length}
        </p>
        <button
          onClick={() => setIsFinished(true)}
          className="text-xs text-white/30 hover:text-white/60 font-mono"
        >
          TERMINAR
        </button>
      </div>

      {/* Exercise progress pills */}
      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto">
        {exercises.map((ex, i) => {
          const doneSets = loggedSets.filter((s) => s.exerciseId === ex.id && !s.isWarmup).length
          const isActive = i === currentExerciseIndex
          const isDone = doneSets >= ex.sets_target
          return (
            <div
              key={ex.sessionExerciseId}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-mono transition-all ${
                isDone
                  ? 'bg-[#C8FF00]/20 text-[#C8FF00] border border-[#C8FF00]/30'
                  : isActive
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-white/30 border border-white/10'
              }`}
            >
              {isDone ? '✓ ' : ''}{ex.name.split(' ')[0]}
            </div>
          )
        })}
        <button
          onClick={() => setShowExerciseSelector(true)}
          className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-mono bg-white/5 text-white/20 border border-dashed border-white/10 hover:border-white/30 transition-all"
        >
          + añadir
        </button>
      </div>

      {/* Set progress bars */}
      <div className="flex gap-2 px-4 pb-3">
        {Array.from({ length: currentExercise.sets_target }).map((_, i) => {
          const done = i < setsForCurrentExercise.filter((s) => !s.isWarmup).length
          const active = i === currentSetNumber - 1
          return (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                done ? 'bg-[#C8FF00]' : active ? 'bg-white/40' : 'bg-white/10'
              }`}
            />
          )
        })}
      </div>

      {/* Main logger */}
      <div className="flex-1 px-4 pb-8">
        <SetLogger
          key={`${currentExercise.sessionExerciseId}-${currentSetNumber}`}
          exerciseId={currentExercise.id}
          exerciseName={currentExercise.name}
          setNumber={currentSetNumber}
          onSetLogged={handleSetLogged}
          onSkip={
            currentExerciseIndex < exercises.length - 1
              ? () => {
                  setCurrentExerciseIndex(i => i + 1)
                  setCurrentSetNumber(1)
                }
              : undefined
          }
        />
      </div>
    </div>
  )
}
