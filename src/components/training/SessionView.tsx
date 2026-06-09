'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { SetLogger } from './SetLogger'
import { useSessionStore } from '@/stores/session.store'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { Button } from '@/components/ui/button'
import { Play, ChevronRight, CheckCircle } from 'lucide-react'

interface Template { id: string; name: string; training_days_per_week: number | null }

interface SessionViewProps {
  athleteId: string
  weightUnit: 'kg' | 'lbs'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialTemplate: any | null
  availableTemplates: Template[]
}

const DEFAULT_SETS_TARGET = 3

export function SessionView({ athleteId, initialTemplate, availableTemplates }: SessionViewProps) {
  const router = useRouter()
  const locale = useLocale()
  const { isOnline } = useOfflineSync()
  const {
    activeSession,
    exercises,
    currentExerciseIndex,
    setActiveSession,
    setExercises,
    addSet,
    setCurrentExerciseIndex,
    clearSession,
  } = useSessionStore()
  const [starting, setStarting] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate?.id ?? '')
  const [elapsed, setElapsed] = useState(0)

  void athleteId

  const isActive = activeSession !== null
  const sessionId = activeSession?.id ?? null

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [isActive])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleStart = async () => {
    setStarting(true)
    const res = await fetch('/api/training/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: selectedTemplateId || null,
        sessionDate: new Date().toISOString().split('T')[0],
      }),
    })
    const session = await res.json()

    const template = initialTemplate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exs = template?.template_exercises
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.sort((a: any, b: any) => a.order_in_day - b.order_in_day)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map((te: any, i: number) => ({
        id: `${session.id}-${i}`,
        exercise_id: te.exercise_id,
        name: te.exercise?.name ?? 'Ejercicio',
        muscle_group_primary: te.exercise?.muscle_group_primary ?? '',
        slug: te.exercise?.slug ?? '',
        order_in_session: i,
        sets: [] as import('@/stores/session.store').ActiveSet[],
      })) ?? []

    setActiveSession({
      id: session.id,
      athlete_id: session.athlete_id ?? '',
      template_id: selectedTemplateId || null,
      session_date: new Date().toISOString().split('T')[0],
      started_at: new Date().toISOString(),
      day_number: null,
      day_label: null,
    })
    setExercises(exs)
    setStarting(false)
  }

  const handleEnd = async () => {
    if (sessionId) {
      await fetch(`/api/training/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ended_at: new Date().toISOString() }),
      })
    }
    clearSession()
    router.push(`/${locale}/training/history`)
  }

  if (!isActive) {
    return (
      <div className="p-4 space-y-6">
        <div className="pt-2">
          <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          {!isOnline && <p className="text-xs text-amber-500 mt-1">⚠ Sin conexión — se guardará localmente</p>}
        </div>

        {availableTemplates.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Plantilla</p>
            {availableTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-colors ${selectedTemplateId === t.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'}`}
              >
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.training_days_per_week} días/semana</p>
              </button>
            ))}
          </div>
        )}

        {availableTemplates.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
            Sin plantillas. <a href={`/${locale}/training/templates`} className="text-primary">Crea una primero →</a>
          </div>
        )}

        <Button className="w-full h-14 text-base font-semibold rounded-2xl" onClick={handleStart} disabled={starting}>
          <Play className="h-5 w-5 mr-2" />
          {starting ? 'Iniciando...' : 'Comenzar sesión'}
        </Button>
      </div>
    )
  }

  const currentEx = exercises[currentExerciseIndex]
  const totalExercises = exercises.length
  const completedExercises = exercises.filter(ex => ex.sets.length >= DEFAULT_SETS_TARGET).length

  if (completedExercises === totalExercises && totalExercises > 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">¡Sesión completada!</h2>
          <p className="text-sm text-muted-foreground mt-1">Duración: {formatTime(elapsed)}</p>
        </div>
        <Button className="w-full h-14 text-base rounded-2xl" onClick={handleEnd}>
          Guardar y finalizar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">⏱ {formatTime(elapsed)}</p>
          <div className="text-xs text-muted-foreground">{completedExercises}/{totalExercises} ejercicios</div>
        </div>
        <div className="mt-2 h-1 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-4">
        {currentEx && (
          <SetLogger
            key={`${currentEx.exercise_id}-${currentEx.sets.length + 1}`}
            exerciseId={currentEx.exercise_id}
            exerciseName={currentEx.name}
            setNumber={currentEx.sets.length + 1}
            previousWeight={currentEx.sets[currentEx.sets.length - 1]?.weight_kg ?? undefined}
            previousReps={currentEx.sets[currentEx.sets.length - 1]?.reps_completed ?? undefined}
            onSetLogged={async (data) => {
              addSet(currentExerciseIndex, {
                set_number: data.setNumber,
                set_type: data.isWarmup ? 'warmup' : 'working',
                weight_kg: data.weightKg,
                reps_completed: data.reps,
                rir_actual: data.rir ?? null,
                rpe_actual: null,
                notes: null,
              })
              if (currentEx.sets.length + 1 >= DEFAULT_SETS_TARGET) {
                setCurrentExerciseIndex(Math.min(currentExerciseIndex + 1, totalExercises - 1))
              }
            }}
            onSkip={currentExerciseIndex < totalExercises - 1
              ? () => setCurrentExerciseIndex(currentExerciseIndex + 1)
              : undefined}
          />
        )}
      </div>

      {currentExerciseIndex < totalExercises - 1 && (
        <div className="px-4 pb-24">
          <button
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
            className="w-full text-xs text-muted-foreground flex items-center justify-center gap-1 py-2"
          >
            Saltar ejercicio <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
