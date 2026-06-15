import { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isEs = locale === 'es'
  return {
    title: isEs
      ? 'AIS — El sistema operativo para atletas de hipertrofia'
      : 'AIS — The operating system for hypertrophy athletes',
    description: isEs
      ? 'Registra entrenamientos en 5 segundos, importa cualquier rutina con IA, progresion automatica y AI Coach con tu historial real. Gratis.'
      : 'Log workouts in 5 seconds, import any routine with AI, automatic progression and AI Coach with your real history. Free.',
    openGraph: {
      title: 'AIS — Athlete Intelligence System',
      description: isEs
        ? 'El sistema de memoria deportiva para atletas de hipertrofia'
        : 'The sports memory system for hypertrophy athletes',
      url: `https://athlete-intelligence-system.vercel.app/${locale}`,
      siteName: 'AIS',
    },
    robots: { index: true, follow: true },
  }
}

const PROBLEMS = [
  {
    es: 'Llevas el entrenamiento en un cuaderno o en la cabeza',
    en: 'You track workouts in a notebook or from memory',
    icon: 'N',
  },
  {
    es: 'No recuerdas que peso usaste la semana pasada',
    en: 'You cannot remember what weight you used last week',
    icon: '?',
  },
  {
    es: 'Las apps que existen son caras o complicadas',
    en: 'Existing apps are expensive or complicated',
    icon: '$',
  },
  {
    es: 'Nadie te dice si estas progresando de verdad',
    en: 'Nobody tells you if you are actually progressing',
    icon: '~',
  },
]

const FEATURES = [
  {
    icon: 'AI',
    es_title: 'Importador Inteligente',
    en_title: 'Smart Importer',
    es_desc: 'Foto del cuaderno, PDF, Excel o texto. La IA lo convierte en datos estructurados automaticamente.',
    en_desc: 'Photo of your notebook, PDF, Excel or text. AI converts it to structured data automatically.',
  },
  {
    icon: '5s',
    es_title: 'Registro en 5 segundos',
    en_title: '5-second logging',
    es_desc: 'Post-sesion: Pump, Fatiga, Recuperacion, RIR. Cuatro taps y listo. Sin friccion.',
    en_desc: 'Post-session: Pump, Fatigue, Recovery, RIR. Four taps and done. Zero friction.',
  },
  {
    icon: '>',
    es_title: 'Progresion automatica',
    en_title: 'Auto progression',
    es_desc: 'Doble progresion, RIR, Top Set. El sistema decide cuando subir peso basandose en tu historial real.',
    en_desc: 'Double progression, RIR, Top Set. The system decides when to add weight based on your real history.',
  },
  {
    icon: 'M',
    es_title: 'Athlete Memory Engine',
    en_title: 'Athlete Memory Engine',
    es_desc: 'Recuerda cada sesion, detecta patrones de fatiga, recuperacion y mesociclos. Tu historial completo, siempre disponible.',
    en_desc: 'Remembers every session, detects fatigue patterns, recovery and mesocycles. Your complete history, always available.',
  },
]

const COMPARISON = [
  { feature_es: 'Precio', feature_en: 'Price', ais: 'Gratis / 14.99 EUR', rp: '25-35 USD/mes', jefit: '19.99 USD/mes' },
  { feature_es: 'Memoria del atleta', feature_en: 'Athlete memory', ais: 'Si', rp: 'Parcial', jefit: 'No' },
  { feature_es: 'Importar cuadernos', feature_en: 'Import notebooks', ais: 'Si (IA)', rp: 'No', jefit: 'No' },
  { feature_es: 'Feedback post-sesion', feature_en: 'Post-session feedback', ais: 'Si (4 taps)', rp: 'Si', jefit: 'Limitado' },
  { feature_es: 'AI Coach con historial', feature_en: 'AI Coach with history', ais: 'Si', rp: 'No', jefit: 'No' },
  { feature_es: 'Wearables', feature_en: 'Wearables', ais: 'Proximo', rp: 'No', jefit: 'Si' },
]

// Nombres anonimizados para la tabla comparativa
const COMPETITOR_LABELS = {
  col1_es: 'App A (ciencia)',
  col1_en: 'App A (science)',
  col2_es: 'App B (clasica)',
  col2_en: 'App B (classic)',
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  const isEs = locale === 'es'

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* NAV */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-5xl mx-auto">
        <span className="font-bold text-lg" style={{ color: '#C8FF00', fontFamily: 'Syne, sans-serif' }}>
          AIS
        </span>
        <div className="flex gap-3 items-center">
          <Link
            href={locale === 'es' ? '/en' : '/es'}
            className="text-xs"
            style={{ color: '#555' }}
          >
            {isEs ? 'EN' : 'ES'}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="text-sm"
            style={{ color: '#888' }}
          >
            {isEs ? 'Acceder' : 'Log in'}
          </Link>
          <Link
            href={`/${locale}/register`}
            className="text-sm font-bold px-4 py-2 rounded-xl"
            style={{ background: '#C8FF00', color: '#0A0A0F' }}
          >
            {isEs ? 'Empezar gratis' : 'Start free'}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-16 pb-20 max-w-3xl mx-auto text-center">
        <div
          className="inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest"
          style={{ background: '#C8FF0015', color: '#C8FF00', border: '1px solid #C8FF0033' }}
        >
          {isEs ? 'Para atletas de hipertrofia' : 'For hypertrophy athletes'}
        </div>
        <h1
          className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs
            ? 'El sistema operativo para tu hipertrofia'
            : 'The operating system for your hypertrophy'}
        </h1>
        <p className="text-lg mb-3" style={{ color: '#888' }}>
          {isEs
            ? 'Registra, importa, progresa. Con IA que conoce tu historial real.'
            : 'Log, import, progress. With AI that knows your real history.'}
        </p>
        <p className="text-sm mb-10" style={{ color: '#555' }}>
          {isEs ? 'Gratis para siempre. Pro desde 14.99 EUR/mes.' : 'Free forever. Pro from EUR 14.99/month.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}/register`}
            className="px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:opacity-90"
            style={{ background: '#C8FF00', color: '#0A0A0F', fontFamily: 'Syne, sans-serif' }}
          >
            {isEs ? 'Empezar gratis' : 'Start free'}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="px-8 py-4 rounded-2xl font-bold text-lg"
            style={{ background: '#111118', color: '#888', border: '1px solid #222' }}
          >
            {isEs ? 'Ya tengo cuenta' : 'I have an account'}
          </Link>
        </div>
      </section>

      {/* PROBLEMS */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold mb-8 text-center"
          style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs ? 'Si entrenas en serio, esto te suena.' : 'If you train seriously, this sounds familiar.'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROBLEMS.map((p, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 rounded-2xl"
              style={{ background: '#111118', border: '1px solid #1a1a2e' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#FF6B6B22', color: '#FF6B6B' }}
              >
                {p.icon}
              </div>
              <p className="text-sm" style={{ color: '#aaa' }}>{isEs ? p.es : p.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs ? 'AIS lo resuelve todo.' : 'AIS solves all of it.'}
        </h2>
        <p className="text-center text-sm mb-10" style={{ color: '#555' }}>
          {isEs
            ? 'No es otra app de series y reps. Es tu memoria deportiva con IA.'
            : 'Not another sets and reps app. It is your sports memory with AI.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl"
              style={{ background: '#111118', border: '1px solid #1a1a2e' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-3"
                style={{ background: '#C8FF0015', color: '#C8FF00' }}
              >
                {f.icon}
              </div>
              <p className="font-bold mb-1" style={{ color: '#fff' }}>
                {isEs ? f.es_title : f.en_title}
              </p>
              <p className="text-sm" style={{ color: '#666' }}>
                {isEs ? f.es_desc : f.en_desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs ? 'Comparado con la competencia.' : 'Compared to the competition.'}
        </h2>
        <p className="text-center text-sm mb-8" style={{ color: '#555' }}>
          {isEs
            ? 'Mas funcionalidades. Mejor precio. Sin trampa.'
            : 'More features. Better price. No tricks.'}
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1a1a2e' }}>
          <div
            className="grid grid-cols-4 text-xs font-bold uppercase tracking-widest px-4 py-3"
            style={{ background: '#0d0d14', color: '#555' }}
          >
            <span>{isEs ? 'Caracteristica' : 'Feature'}</span>
            <span style={{ color: '#C8FF00' }}>AIS</span>
            <span>{isEs ? COMPETITOR_LABELS.col1_es : COMPETITOR_LABELS.col1_en}</span>
            <span>{isEs ? COMPETITOR_LABELS.col2_es : COMPETITOR_LABELS.col2_en}</span>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-4 px-4 py-3 text-sm"
              style={{
                background: '#111118',
                borderTop: '1px solid #1a1a2e',
              }}
            >
              <span style={{ color: '#888' }}>{isEs ? row.feature_es : row.feature_en}</span>
              <span className="font-bold" style={{ color: '#C8FF00' }}>{row.ais}</span>
              <span style={{ color: '#555' }}>{row.rp}</span>
              <span style={{ color: '#555' }}>{row.jefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold mb-10 text-center"
          style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs ? 'Precio transparente.' : 'Transparent pricing.'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free */}
          <div
            className="p-6 rounded-2xl"
            style={{ background: '#111118', border: '1px solid #1a1a2e' }}
          >
            <p className="font-bold text-lg mb-1" style={{ color: '#fff' }}>Free</p>
            <p className="text-3xl font-bold mb-4" style={{ color: '#fff', fontFamily: 'DM Mono, monospace' }}>
              0 EUR
            </p>
            <div className="space-y-2 mb-6">
              {[
                isEs ? 'Registro de entrenamientos' : 'Workout logging',
                isEs ? '30 sesiones/mes' : '30 sessions/month',
                isEs ? '3 importaciones/mes' : '3 imports/month',
                isEs ? 'Historial basico' : 'Basic history',
              ].map((f, i) => (
                <div key={i} className="flex gap-2 text-sm" style={{ color: '#888' }}>
                  <span style={{ color: '#C8FF00' }}>v</span> {f}
                </div>
              ))}
            </div>
            <Link
              href={`/${locale}/register`}
              className="block w-full py-3 rounded-xl text-center font-bold text-sm"
              style={{ background: '#1a1a2e', color: '#aaa' }}
            >
              {isEs ? 'Empezar gratis' : 'Start free'}
            </Link>
          </div>
          {/* Pro */}
          <div
            className="p-6 rounded-2xl"
            style={{ background: '#0d1a00', border: '1px solid #C8FF0044' }}
          >
            <div className="flex justify-between items-center mb-1">
              <p className="font-bold text-lg" style={{ color: '#fff' }}>Pro</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
                style={{ background: '#C8FF00', color: '#0A0A0F' }}
              >
                {isEs ? 'Recomendado' : 'Recommended'}
              </span>
            </div>
            <p className="text-3xl font-bold mb-4" style={{ color: '#C8FF00', fontFamily: 'DM Mono, monospace' }}>
              14.99 <span className="text-base" style={{ color: '#888' }}>EUR/mes</span>
            </p>
            <div className="space-y-2 mb-6">
              {[
                isEs ? 'Todo lo de Free' : 'Everything in Free',
                isEs ? 'Sesiones ilimitadas' : 'Unlimited sessions',
                isEs ? 'Importaciones ilimitadas' : 'Unlimited imports',
                isEs ? 'AI Coach con historial real' : 'AI Coach with real history',
                isEs ? 'Progresion automatica' : 'Auto progression',
                isEs ? 'Athlete Memory Engine completo' : 'Full Athlete Memory Engine',
              ].map((f, i) => (
                <div key={i} className="flex gap-2 text-sm" style={{ color: '#ccc' }}>
                  <span style={{ color: '#C8FF00' }}>v</span> {f}
                </div>
              ))}
            </div>
            <Link
              href={`/${locale}/register`}
              className="block w-full py-3 rounded-xl text-center font-bold text-sm"
              style={{ background: '#C8FF00', color: '#0A0A0F' }}
            >
              {isEs ? 'Empezar — 14.99 EUR/mes' : 'Start — EUR 14.99/month'}
            </Link>
          </div>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: '#444' }}>
          {isEs ? 'Cancela cuando quieras. Sin permanencia.' : 'Cancel anytime. No commitment.'}
        </p>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-20 max-w-xl mx-auto text-center">
        <h2
          className="text-3xl font-bold mb-4"
          style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs
            ? 'Empieza hoy. Es gratis.'
            : 'Start today. It is free.'}
        </h2>
        <p className="text-sm mb-8" style={{ color: '#666' }}>
          {isEs
            ? 'Sin tarjeta de credito. Sin trampa. Registrate en 30 segundos.'
            : 'No credit card. No tricks. Sign up in 30 seconds.'}
        </p>
        <Link
          href={`/${locale}/register`}
          className="inline-block px-10 py-5 rounded-2xl font-bold text-xl transition-all hover:opacity-90"
          style={{ background: '#C8FF00', color: '#0A0A0F', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs ? 'Crear cuenta gratis' : 'Create free account'}
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-8 text-center" style={{ borderTop: '1px solid #1a1a2e' }}>
        <p className="text-xs" style={{ color: '#444' }}>
          AIS — Athlete Intelligence System · 2026
        </p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href={`/${locale}/login`} className="text-xs" style={{ color: '#555' }}>
            {isEs ? 'Acceder' : 'Log in'}
          </Link>
          <Link href={`/${locale}/upgrade`} className="text-xs" style={{ color: '#555' }}>
            Pro
          </Link>
        </div>
      </footer>

    </div>
  )
}
