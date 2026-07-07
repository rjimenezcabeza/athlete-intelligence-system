'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { ProgressionSuggestionsPanel } from '@/components/workout/ProgressionSuggestionsPanel'

interface Props {
  sessionId: string
  locale: string
}

const STEPS = [
  {
    key: 'pump_rating' as const,
    label: 'Pump muscular',
    labelEn: 'Muscle Pump',
    emoji: ['😑', '😐', '💪', '🔥', '🚀'],
    descriptions: ['Sin pump', 'Leve', 'Moderado', 'Intenso', 'Brutal'],
    descriptionsEn: ['No pump', 'Slight', 'Moderate', 'Intense', 'Insane'],
  },
  {
    key: 'local_fatigue' as const,
    label: 'Fatiga local',
    labelEn: 'Local Fatigue',
    emoji: ['🟢', '🟡', '🟠', '🔴', '💀'],
    descriptions: ['Sin fatiga', 'Leve', 'Moderada', 'Alta', 'Extrema'],
    descriptionsEn: ['None', 'Slight', 'Moderate', 'High', 'Extreme'],
  },
  {
    key: 'perceived_recovery' as const,
    label: 'Recuperación percibida',
    labelEn: 'Perceived Recovery',
    emoji: ['💀', '😩', '😐', '😊', '⚡'],
    descriptions: ['Destrozado', 'Cansado', 'Normal', 'Bien', 'Fresco'],
    descriptionsEn: ['Destroyed', 'Tired', 'Normal', 'Good', 'Fresh'],
  },
]

const RIR_VALUES = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

export default function PostSessionFeedback({ sessionId, locale }: Props) {
  const router = useRouter()
  const { feedbackStep, feedbackData, setFeedbackStep, setFeedbackField, resetFeedback } =
    useSessionStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const isEs = locale === 'es'

  const currentStep = STEPS[feedbackStep]
  const isRirStep = feedbackStep === STEPS.length
  const totalSteps = STEPS.length + 1

  if (showSuggestions) {
    return (
      <div style={{ background: '#0A0A0F', minHeight: '100vh', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif' }}>
            {isEs ? '¡Sesión completada! 🎉' : 'Session complete! 🎉'}
          </h2>
        </div>
        <ProgressionSuggestionsPanel
          sessionId={sessionId}
          locale={locale}
        />
        <button
          onClick={() => router.push(`/${locale}/dashboard?completed=true`)}
          style={{ marginTop: '8px', width: '100%', padding: '16px', background: 'linear-gradient(135deg,#C8FF00 0%,#88DD00 100%)', border: 'none', borderRadius: '14px', color: '#0A0A0F', fontSize: '16px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs ? 'Ir al Dashboard →' : 'Go to Dashboard →'}
        </button>
      </div>
    )
  }

  const handleRating = (value: number) => {
    setFeedbackField(currentStep.key, value)
    setFeedbackStep(feedbackStep + 1)
  }

  const handleRirSelect = async (value: number) => {
    setFeedbackField('rir_session_avg', value)
    await submitFeedback({ ...feedbackData, rir_session_avg: value })
  }

  const submitFeedback = async (data: typeof feedbackData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error saving feedback')
      resetFeedback()
      setShowSuggestions(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error guardando feedback'
      setError(msg)
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    resetFeedback()
    router.push(`/${locale}/dashboard`)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-4 py-8"
      style={{ background: '#0A0A0F' }}
    >
      {/* Header */}
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-mono" style={{ color: '#666' }}>
            {isEs ? 'Post-sesión' : 'Post-session'} · {isRirStep ? totalSteps : feedbackStep + 1}/{totalSteps}
          </p>
          <button
            onClick={handleSkip}
            className="text-sm font-mono"
            style={{ color: '#666' }}
          >
            {isEs ? 'Saltar' : 'Skip'}
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i < (isRirStep ? totalSteps : feedbackStep)
                    ? '#C8FF00'
                    : i === (isRirStep ? totalSteps - 1 : feedbackStep)
                    ? '#C8FF00'
                    : '#222',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center">
        {!isRirStep && currentStep && (
          <>
            <h2
              className="text-2xl font-bold mb-2 text-center"
              style={{ fontFamily: 'Syne, sans-serif', color: '#fff' }}
            >
              {isEs ? currentStep.label : currentStep.labelEn}
            </h2>
            <p className="text-sm mb-10 text-center" style={{ color: '#888' }}>
              {isEs ? '¿Cómo te has sentido?' : 'How did you feel?'}
            </p>

            <div className="flex gap-3 w-full justify-center mb-4">
              {[1, 2, 3, 4, 5].map((val) => {
                const idx = val - 1
                return (
                  <button
                    key={val}
                    onClick={() => handleRating(val)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all active:scale-95"
                    style={{ borderColor: '#222', background: '#111', flex: 1 }}
                  >
                    <span className="text-2xl">{currentStep.emoji[idx]}</span>
                    <span
                      className="text-xs font-mono text-center leading-tight"
                      style={{ color: '#888', fontSize: '10px' }}
                    >
                      {isEs ? currentStep.descriptions[idx] : currentStep.descriptionsEn[idx]}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {isRirStep && (
          <>
            <h2
              className="text-2xl font-bold mb-2 text-center"
              style={{ fontFamily: 'Syne, sans-serif', color: '#fff' }}
            >
              {isEs ? 'RIR promedio real' : 'Average real RIR'}
            </h2>
            <p className="text-sm mb-10 text-center" style={{ color: '#888' }}>
              {isEs
                ? '¿Cuántas reps te quedaban de media?'
                : 'How many reps did you have left on average?'}
            </p>

            <div className="grid grid-cols-4 gap-3 w-full">
              {RIR_VALUES.map((val) => (
                <button
                  key={val}
                  onClick={() => !isSubmitting && handleRirSelect(val)}
                  disabled={isSubmitting}
                  className="p-4 rounded-xl border font-mono font-bold text-lg transition-all active:scale-95"
                  style={{ borderColor: '#333', background: '#111', color: '#C8FF00' }}
                >
                  {val}
                </button>
              ))}
            </div>

            {isSubmitting && (
              <p className="mt-8 text-sm font-mono" style={{ color: '#C8FF00' }}>
                {isEs ? 'Guardando...' : 'Saving...'}
              </p>
            )}
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-center" style={{ color: '#ff6b6b' }}>
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-sm">
        <p className="text-center text-xs font-mono" style={{ color: '#444' }}>
          {isEs
            ? 'Estos datos alimentan tu memoria atlética'
            : 'This data feeds your athlete memory'}
        </p>
      </div>
    </div>
  )
}
