'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const LANGUAGES = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
]

const GOALS = [
  { key: 'hypertrophy', es: 'Hipertrofia maxima',  en: 'Maximum hypertrophy' },
  { key: 'strength',    es: 'Fuerza y masa',        en: 'Strength and mass'   },
  { key: 'recomp',     es: 'Recomposicion',         en: 'Recomposition'       },
  { key: 'cut',        es: 'Definicion',            en: 'Cut / Definition'    },
]
const EXP = [
  { key: 1, es: '< 1 ano',  en: '< 1 year'  },
  { key: 2, es: '1-2 anos', en: '1-2 years' },
  { key: 4, es: '2-4 anos', en: '2-4 years' },
  { key: 7, es: '4+ anos',  en: '4+ years'  },
]

export default function OnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ display_name: '', primary_goal: '', training_experience_years: 0, body_weight_kg: '', weight_unit: 'kg' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const up = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const next = () => setStep(s => s + 1)

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: locale })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/${locale}/dashboard`)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setLoading(false) }
  }

  const btn = { background: '#C8FF00', color: '#0A0A0F', fontFamily: 'Syne, sans-serif' }
  const inp = { background: '#111118', border: '1px solid #333', color: '#fff' }

  const steps = [
    <div key="language" className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
        {isEs ? 'Elige tu idioma' : 'Choose your language'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {LANGUAGES.map(lang => (
          <button key={lang.code}
            onClick={() => {
              if (lang.code !== locale) {
                window.location.href = `/${lang.code}/onboarding`
              } else {
                next()
              }
            }}
            className="py-4 px-4 rounded-xl text-left font-medium transition-all"
            style={{ background: locale === lang.code ? '#C8FF00' : '#111118', color: locale === lang.code ? '#0A0A0F' : '#ddd', border: `1px solid ${locale === lang.code ? '#C8FF00' : '#222'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{lang.flag}</span>
            <span style={{ fontFamily: 'Syne, sans-serif' }}>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>,

    <div key="name" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Como te llamas?' : "What's your name?"}
        </h2>
        <p className="text-sm" style={{ color: '#666' }}>{isEs ? 'Como quieres que te llame el sistema' : 'How should the system call you'}</p>
      </div>
      <input type="text" value={form.display_name} onChange={e => up('display_name', e.target.value)}
        placeholder={isEs ? 'Tu nombre o apodo' : 'Your name or nickname'}
        className="w-full rounded-xl px-4 py-4 text-lg outline-none" style={inp} autoFocus />
      <button onClick={next} disabled={form.display_name.trim().length < 2}
        className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-40" style={btn}>
        {isEs ? 'Continuar' : 'Continue'}
      </button>
    </div>,

    <div key="goal" className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
        {isEs ? 'Cual es tu objetivo?' : 'What is your goal?'}
      </h2>
      {GOALS.map(g => (
        <button key={g.key} onClick={() => { up('primary_goal', g.key); next() }}
          className="w-full py-4 px-5 rounded-xl text-left font-medium transition-all"
          style={{ background: form.primary_goal === g.key ? '#C8FF00' : '#111118', color: form.primary_goal === g.key ? '#0A0A0F' : '#ddd', border: `1px solid ${form.primary_goal === g.key ? '#C8FF00' : '#222'}` }}>
          {isEs ? g.es : g.en}
        </button>
      ))}
    </div>,

    <div key="exp" className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
        {isEs ? 'Cuanto llevas entrenando?' : 'How long have you been training?'}
      </h2>
      {EXP.map(e => (
        <button key={e.key} onClick={() => { up('training_experience_years', e.key); next() }}
          className="w-full py-4 px-5 rounded-xl text-left font-medium transition-all"
          style={{ background: form.training_experience_years === e.key ? '#C8FF00' : '#111118', color: form.training_experience_years === e.key ? '#0A0A0F' : '#ddd', border: `1px solid ${form.training_experience_years === e.key ? '#C8FF00' : '#222'}` }}>
          {isEs ? e.es : e.en}
        </button>
      ))}
    </div>,

    <div key="weight" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Cual es tu peso?' : 'What is your weight?'}
        </h2>
        <p className="text-sm" style={{ color: '#666' }}>{isEs ? 'Opcional — mejora las recomendaciones' : 'Optional — improves recommendations'}</p>
      </div>
      <div className="flex gap-2">
        <input type="number" value={form.body_weight_kg} onChange={e => up('body_weight_kg', e.target.value)}
          placeholder="80" className="flex-1 rounded-xl px-4 py-4 text-lg outline-none" style={inp} />
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #333' }}>
          {['kg','lbs'].map(u => (
            <button key={u} onClick={() => up('weight_unit', u)} className="px-4 py-4 text-sm font-bold"
              style={{ background: form.weight_unit === u ? '#C8FF00' : '#111118', color: form.weight_unit === u ? '#0A0A0F' : '#666' }}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <button onClick={submit} disabled={loading} className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-40" style={btn}>
          {loading ? (isEs ? 'Configurando...' : 'Setting up...') : (isEs ? 'Empezar' : 'Start')}
        </button>
        <button onClick={submit} className="w-full py-2 text-sm" style={{ color: '#555' }}>
          {isEs ? 'Saltar' : 'Skip'}
        </button>
      </div>
      {error && <p className="text-sm text-center" style={{ color: '#FF6B6B' }}>{error}</p>}
    </div>,
  ]

  return (
    <div className="min-h-screen flex flex-col px-6 py-12" style={{ background: '#0A0A0F' }}>
      <style>{`
        @keyframes slideInFromRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes bounceSelect { 0% { transform: scale(1); } 50% { transform: scale(0.96); } 100% { transform: scale(1); } }
      `}</style>
      <p className="text-xs mb-3" style={{ color: '#555', textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>
        {step + 1} / {steps.length}
      </p>
      <div className="mb-10">
        <div className="h-0.5 rounded-full mb-4" style={{ background: '#1a1a2e' }}>
          <div className="h-0.5 rounded-full transition-all duration-500"
            style={{ width: `${(step / (steps.length - 1)) * 100}%`, background: '#C8FF00' }} />
        </div>
        <div className="flex justify-between px-1">
          {steps.map((_, i) => (
            <div key={i} className="transition-all duration-300" style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: i <= step ? '#C8FF00' : '#1a1a2e',
              transform: i === step ? 'scale(1.5)' : 'scale(1)'
            }} />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div
          key={step}
          style={{ animation: 'slideInFromRight 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
        >
          {steps[step]}
        </div>
      </div>
    </div>
  )
}
