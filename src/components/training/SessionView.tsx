'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { SetLogger } from './SetLogger'
import { useSessionStore, type ActiveSet } from '@/stores/session.store'
import { useOfflineSync } from '@/hooks/useOfflineSync'

interface Template { id: string; name: string; training_days_per_week: number | null }

interface TemplateExercise {
  id: string
  day_number: number
  day_label?: string | null
  order_in_day: number
  sets_target?: number | null
  rep_range_min?: number | null
  rep_range_max?: number | null
  rir_target?: number | null
  exercise?: { name: string; muscle_group_primary: string; slug?: string }
}

interface FullTemplate {
  id: string
  name: string
  training_days_per_week?: number | null
  split_type?: string | null
  template_exercises?: TemplateExercise[]
}

interface SessionViewProps {
  athleteId: string
  weightUnit: 'kg' | 'lbs'
  initialTemplate: FullTemplate | null
  availableTemplates: Template[]
}

const DEFAULT_SETS_TARGET = 3

const T = {
  es: {
    start: 'Iniciar sesión', starting: 'Iniciando...', noTemplate: 'Sin plantilla',
    selectDay: 'Selecciona el día', exercises: 'ejercicios', noTemplates: 'Sin plantillas.',
    createFirst: 'Crea una primero →', template: 'Plantilla', dayLabel: 'Día',
    preview: 'Vista previa', sets: 'series', reps: 'reps', rir: 'RIR',
    offline: '⚠ Sin conexión — se guardará localmente',
    complete: '¡Sesión completada!', duration: 'Duración:', save: 'Guardar y finalizar',
    exerciseCount: 'ejercicios completados',
  },
  en: {
    start: 'Start session', starting: 'Starting...', noTemplate: 'No template',
    selectDay: 'Select day', exercises: 'exercises', noTemplates: 'No templates.',
    createFirst: 'Create one first →', template: 'Template', dayLabel: 'Day',
    preview: 'Preview', sets: 'sets', reps: 'reps', rir: 'RIR',
    offline: '⚠ Offline — will save locally',
    complete: 'Session complete!', duration: 'Duration:', save: 'Save & finish',
    exerciseCount: 'exercises completed',
  },
}

function t(locale: string, key: keyof typeof T['es']): string {
  const lang = T[locale as 'es' | 'en'] ?? T.es
  return lang[key]
}

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
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [elapsed, setElapsed] = useState(0)

  void athleteId

  const isActive = activeSession !== null
  const sessionId = activeSession?.id ?? null

  // Find the currently selected full template (initialTemplate or none)
  const selectedTemplate = selectedTemplateId === initialTemplate?.id ? initialTemplate : null

  // Get unique days from template exercises
  const templateDays = selectedTemplate?.template_exercises
    ? [...new Map(
        selectedTemplate.template_exercises
          .filter(te => te.day_number != null)
          .map(te => [te.day_number, te])
      ).values()]
        .sort((a, b) => a.day_number - b.day_number)
    : []

  // Exercises for the selected day
  const dayExercises = selectedTemplate?.template_exercises
    ?.filter(te => te.day_number === selectedDay)
    ?.sort((a, b) => a.order_in_day - b.order_in_day) ?? []

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [isActive])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleStart = async () => {
    setStarting(true)

    // Use correct API endpoint as per CLAUDE.md
    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: selectedTemplateId || null,
        dayNumber: selectedDay || null,
        dayLabel: templateDays.find(d => d.day_number === selectedDay)?.day_label || null,
        sessionDate: new Date().toISOString().split('T')[0],
      }),
    })

    if (!res.ok) {
      setStarting(false)
      return
    }

    const { session } = await res.json()
    const exs = dayExercises.map((te, i) => ({
      id: `${session.id}-${i}`,
      exercise_id: te.exercise?.slug ?? te.id,
      name: te.exercise?.name ?? 'Ejercicio',
      muscle_group_primary: te.exercise?.muscle_group_primary ?? '',
      slug: te.exercise?.slug ?? '',
      order_in_session: i,
      sets: [] as ActiveSet[],
    }))

    setActiveSession({
      id: session.id,
      athlete_id: session.athlete_id ?? '',
      template_id: selectedTemplateId || null,
      session_date: new Date().toISOString().split('T')[0],
      started_at: new Date().toISOString(),
      day_number: selectedDay || null,
      day_label: templateDays.find(d => d.day_number === selectedDay)?.day_label || null,
    })
    setExercises(exs)
    setStarting(false)
  }

  const handleEnd = async () => {
    if (sessionId) {
      await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ended_at: new Date().toISOString() }),
      })
    }
    clearSession()
    router.push(`/${locale}/session/${sessionId}/feedback`)
  }

  // ─── PRE-SESSION UI ───────────────────────────────────────────────
  if (!isActive) {
    const BG = '#0A0A0F'
    const CARD = 'rgba(255,255,255,0.04)'
    const BDR = 'rgba(255,255,255,0.08)'
    const ACC = '#C8FF00'

    return (
      <div style={{ padding: '20px 16px', background: BG, minHeight: '100vh' }}>
        {!isOnline && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', borderRadius: 8, fontSize: 12, color: '#FFC107', fontFamily: 'DM Mono,monospace' }}>
            {t(locale, 'offline')}
          </div>
        )}

        <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Syne,sans-serif' }}>
          {t(locale, 'start')}
        </h1>

        {/* Template selector */}
        {availableTemplates.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: '#555', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {t(locale, 'template')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* No template option */}
              <button
                onClick={() => setSelectedTemplateId('')}
                style={{
                  padding: '12px 14px', borderRadius: 12, border: `1px solid ${selectedTemplateId === '' ? ACC : BDR}`,
                  background: selectedTemplateId === '' ? `${ACC}10` : CARD,
                  color: selectedTemplateId === '' ? ACC : '#888',
                  fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Mono,monospace'
                }}
              >
                {t(locale, 'noTemplate')}
              </button>
              {availableTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => { setSelectedTemplateId(tmpl.id); setSelectedDay(1) }}
                  style={{
                    padding: '14px', borderRadius: 12, border: `1px solid ${selectedTemplateId === tmpl.id ? ACC : BDR}`,
                    background: selectedTemplateId === tmpl.id ? `${ACC}10` : CARD,
                    textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Syne,sans-serif' }}>{tmpl.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666', fontFamily: 'DM Mono,monospace' }}>
                      {tmpl.training_days_per_week} {locale === 'es' ? 'días/semana' : 'days/week'}
                    </p>
                  </div>
                  {selectedTemplateId === tmpl.id && (
                    <span style={{ fontSize: 18, color: ACC }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableTemplates.length === 0 && (
          <div style={{ padding: 16, background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, marginBottom: 20, fontSize: 13, color: '#666', fontFamily: 'DM Mono,monospace' }}>
            {t(locale, 'noTemplates')}{' '}
            <a href={`/${locale}/training/templates`} style={{ color: ACC }}>{t(locale, 'createFirst')}</a>
          </div>
        )}

        {/* Day selector — only shown when a template with days is selected */}
        {selectedTemplate && templateDays.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: '#555', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {t(locale, 'selectDay')}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {templateDays.map(d => (
                <button
                  key={d.day_number}
                  onClick={() => setSelectedDay(d.day_number)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: `1px solid ${selectedDay === d.day_number ? ACC : BDR}`,
                    background: selectedDay === d.day_number ? `${ACC}18` : CARD,
                    color: selectedDay === d.day_number ? ACC : '#888',
                    fontSize: 12, fontFamily: 'DM Mono,monospace', cursor: 'pointer', fontWeight: selectedDay === d.day_number ? 700 : 400
                  }}
                >
                  {d.day_label || `${t(locale, 'dayLabel')} ${d.day_number}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exercise preview for selected day */}
        {dayExercises.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: '#555', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {t(locale, 'preview')} · {dayExercises.length} {t(locale, 'exercises')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayExercises.map((te, i) => (
                <div key={te.id} style={{ padding: '10px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#444', fontFamily: 'DM Mono,monospace', minWidth: 20 }}>{i + 1}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#ddd', fontFamily: 'Syne,sans-serif' }}>
                        {te.exercise?.name ?? '—'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#555', fontFamily: 'DM Mono,monospace' }}>
                        {te.exercise?.muscle_group_primary}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 12, color: ACC, fontFamily: 'DM Mono,monospace', fontWeight: 700 }}>
                      {te.sets_target ?? 3}×{te.rep_range_min ?? '?'}-{te.rep_range_max ?? '?'}
                    </p>
                    {te.rir_target != null && (
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#555', fontFamily: 'DM Mono,monospace' }}>
                        RIR {te.rir_target}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={starting}
          style={{
            width: '100%', padding: '18px', borderRadius: 16, border: 'none',
            background: starting ? '#444' : `linear-gradient(135deg,${ACC} 0%,#88DD00 100%)`,
            color: '#0A0A0F', fontSize: 16, fontWeight: 800, cursor: starting ? 'not-allowed' : 'pointer',
            fontFamily: 'Syne,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          {starting ? t(locale, 'starting') : `▶ ${t(locale, 'start')}`}
        </button>
      </div>
    )
  }

  // ─── ACTIVE SESSION ───────────────────────────────────────────────
  const currentEx = exercises[currentExerciseIndex]
  const totalExercises = exercises.length
  const completedExercises = exercises.filter(ex => ex.sets.length >= DEFAULT_SETS_TARGET).length

  if (completedExercises === totalExercises && totalExercises > 0) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24, background: '#0A0A0F' }}>
        <div style={{ fontSize: 64 }}>🏆</div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Syne,sans-serif' }}>
            {t(locale, 'complete')}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#666', fontFamily: 'DM Mono,monospace' }}>
            {t(locale, 'duration')} {formatTime(elapsed)}
          </p>
        </div>
        <button
          onClick={handleEnd}
          style={{ width: '100%', maxWidth: 360, padding: 18, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#C8FF00 0%,#88DD00 100%)', color: '#0A0A0F', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}
        >
          {t(locale, 'save')}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0A0A0F' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#666', fontFamily: 'DM Mono,monospace' }}>⏱ {formatTime(elapsed)}</p>
          <div style={{ fontSize: 12, color: '#666', fontFamily: 'DM Mono,monospace' }}>
            {completedExercises}/{totalExercises} {t(locale, 'exercises')}
          </div>
        </div>
        <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#C8FF00', borderRadius: 2, transition: 'width 0.3s', width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Set logger */}
      <div style={{ flex: 1, padding: 16 }}>
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
        <div style={{ padding: '0 16px 96px' }}>
          <button
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
            style={{ width: '100%', fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono,monospace' }}
          >
            Saltar ejercicio →
          </button>
        </div>
      )}
    </div>
  )
}
