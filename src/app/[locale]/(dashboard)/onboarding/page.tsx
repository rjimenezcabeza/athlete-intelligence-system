'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const GOALS = [
  { key: 'hypertrophy', es: 'Hipertrofia maxima',  en: 'Maximum hypertrophy' },
  { key: 'strength',    es: 'Fuerza y masa',        en: 'Strength and mass' },
  { key: 'recomp',     es: 'Recomposicion',         en: 'Recomposition' },
  { key: 'cut',        es: 'Definicion',            en: 'Cut / Definition' },
]

const EXPERIENCE = [
  { key: 1,  es: '< 1 ano',   en: '< 1 year'  },
  { key: 2,  es: '1-2 anos',  en: '1-2 years' },
  { key: 4,  es: '2-4 anos',  en: '2-4 years' },
  { key: 7,  es: '4+ anos',   en: '4+ years'  },
]

export default function OnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    display_name: '',
    primary_goal: '',
    training_experience_years: 0,
    body_weight_kg: '',
    weight_unit: 'kg',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))
  const next = () => setStep(s => s + 1)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: locale })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/${locale}/dashboard`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  const btnStyle = { background: '#C8FF00', color: '#0A0A0F', fontFamily: 'Syne, sans-serif' }

  const steps = [
    <div key="name" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Como te llamas?' : 'What is your name?'}
        </h2>
        <p className="text-sm" style={{ color: '#666' }}>
          {isEs ? 'Como quieres que te llame el sistema' : 'How should the system call you'}
        </p>
      </div>
      <input
        type="text"
        value={form.display_name}
        onChange={e => update('display_name', e.target.value)}
        placeholder={isEs ? 'Tu nombre o apodo' : 'Your name or nickname'}
        className="w-full rounded-xl px-4 py-4 text-lg outline-none"
        style={{ background: '#111118', border: '1px solid #333', color: '#fff' }}
        autoFocus
      />
      <button onClick={next} disabled={form.display_name.trim().length < 2} className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-40" style={btnStyle}>
        {isEs ? 'Continuar' : 'Continue'}
      </button>
    </div>,

    <div key="goal" className="space-y-4">
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
        {isEs ? 'Cual es tu objetivo?' : 'What is your goal?'}
      </h2>
      <div className="space-y-2">
        {GOALS.map(g => (
          <button key={g.key} onClick={() => { update('primary_goal', g.key); next() }}
            className="w-full py-4 px-5 rounded-xl text-left font-medium transition-all"
            style={{ background: form.primary_goal === g.key ? '#C8FF00' : '#111118', color: form.primary_goal === g.key ? '#0A0A0F' : '#ddd', border: `1px solid ${form.primary_goal === g.key ? '#C8FF00' : '#222'}` }}>
            {isEs ? g.es : g.en}
          </button>
        ))}
      </div>
    </div>,

    <div key="exp" className="space-y-4">
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
        {isEs ? 'Cuanto llevas entrenando?' : 'How long have you been training?'}
      </h2>
      <div className="space-y-2">
        {EXPERIENCE.map(e => (
          <button key={e.key} onClick={() => { update('training_experience_years', e.key); next() }}
            className="w-full py-4 px-5 rounded-xl text-left font-medium transition-all"
            style={{ background: form.training_experience_years === e.key ? '#C8FF00' : '#111118', color: form.training_experience_years === e.key ? '#0A0A0F' : '#ddd', border: `1px solid ${form.training_experience_years === e.key ? '#C8FF00' : '#222'}` }}>
            {isEs ? e.es : e.en}
          </button>
        ))}
      </div>
    </div>,

    <div key="weight" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Cual es tu peso?' : 'What is your weight?'}
        </h2>
        <p className="text-sm" style={{ color: '#666' }}>
          {isEs ? 'Opcional — mejora las recomendaciones' : 'Optional — improves recommendations'}
        </p>
      </div>
      <div className="flex gap-2">
        <input type="number" value={form.body_weight_kg} onChange={e => update('body_weight_kg', e.target.value)}
          placeholder="80" className="flex-1 rounded-xl px-4 py-4 text-lg outline-none"
          style={{ background: '#111118', border: '1px solid #333', color: '#fff' }} />
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #333' }}>
          {['kg', 'lbs'].map(u => (
            <button key={u} onClick={() => update('weight_unit', u)} className="px-4 py-4 text-sm font-bold"
              style={{ background: form.weight_unit === u ? '#C8FF00' : '#111118', color: form.weight_unit === u ? '#0A0A0F' : '#666' }}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <button onClick={submit} disabled={loading} className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-40" style={btnStyle}>
          {loading ? (isEs ? 'Configurando...' : 'Setting up...') : (isEs ? 'Empezar' : 'Start')}
        </button>
        <button onClick={submit} className="w-full py-2 text-sm" style={{ color: '#555' }}>
          {isEs ? 'Saltar' : 'Skip'}
        </button>
      </div>
      {error && <p className="text-sm text-center" style={{ color: '#FF6B6B' }}>{error}</p>}
    </div>,
  ]

  const progress = (step / (steps.length - 1)) * 100

  return (
    <div className="min-h-screen flex flex-col px-6 py-12" style={{ background: '#0A0A0F' }}>
      <div className="mb-10">
        <div className="h-0.5 rounded-full" style={{ background: '#1a1a2e' }}>
          <div className="h-0.5 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#C8FF00' }} />
        </div>
      </div>
      <div className="flex-1">{steps[step]}</div>
    </div>
  )
}
