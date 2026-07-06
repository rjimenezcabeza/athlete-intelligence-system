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
                 