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
  }
}

const PROBLEMS = [
  { es: 'Llevas el entrenamiento en un cuaderno o en la cabeza', en: 'You track workouts in a notebook or from memory', icon: 'N' },
  { es: 'No recuerdas que peso usaste la semana pasada', en: "You can't remember what weight you used last week", icon: '?' },
  { es: 'Las apps que existen son caras o complicadas', en: 'Existing apps are expensive or complicated', icon: '$' },
  { es: 'Nadie te dice si estas progresando de verdad', en: 'Nobody tells you if you are actually progressing', icon: '~' },
]

const FEATURES = [
  { icon: 'AI', es_title: 'Importador Inteligente', en_title: 'Smart Importer', es_desc: 'Foto del cuaderno, PDF, Excel o texto. La IA lo convierte en datos estructurados automaticamente.', en_desc: 'Photo of your notebook, PDF, Excel or text. AI converts it to structured data automatically.' },
  { icon: '5s', es_title: 'Registro en 5 segundos', en_title: '5-second logging', es_desc: 'Post-sesion: Pump, Fatiga, Recuperacion, RIR. Cuatro taps y listo. Sin friccion.', en_desc: 'Post-session: Pump, Fatigue, Recovery, RIR. Four taps and done. Zero friction.' },
  { icon: '↑', es_title: 'Progresion automatica', en_title: 'Auto progression', es_desc: 'Doble progresion, RIR, Top Set. El sistema decide cuando subir peso basandose en tu historial real.', en_desc: 'Double progression, RIR, Top Set. The system decides when to add weight based on your real history.' },
  { icon: 'M', es_title: 'Athlete Memory Engine', en_title: 'Athlete Memory Engine', es_desc: 'Recuerda cada sesion, detecta patrones de fatiga, recuperacion y mesociclos. Tu historial completo, siempre disponible.', en_desc: 'Remembers every session, detects fatigue patterns, recovery and mesocycles. Your complete history, always available.' },
]

const COMPARISON = [
  { feature_es: 'Precio', feature_en: 'Price', ais: 'Gratis / 14.99€', rp: '25-35 USD/mes', jefit: '19.99 USD/mes' },
  { feature_es: 'Memoria del atleta', feature_en: 'Athlete memory', ais: '✓', rp: 'Parcial', jefit: '✗' },
  { feature_es: 'Importar cuadernos IA', feature_en: 'Import notebooks AI', ais: '✓', rp: '✗', jefit: '✗' },
  { feature_es: 'Feedback post-sesion', feature_en: 'Post-session feedback', ais: '✓', rp: '✓', jefit: 'Limitado' },
  { feature_es: 'AI Coach con historial', feature_en: 'AI Coach with history', ais: '✓', rp: '✗', jefit: '✗' },
  { feature_es: 'Precio por sesion', feature_en: 'Price per session', ais: '0.50€', rp: '1+ USD', jefit: '0.70 USD' },
]

const FREE_FEATURES_ES = ['Registro de entrenamientos', '30 sesiones/mes', '3 importaciones IA/mes', 'Historial basico', 'Graficas de progreso']
const FREE_FEATURES_EN = ['Workout logging', '30 sessions/month', '3 AI imports/month', 'Basic history', 'Progress charts']
const PRO_FEATURES_ES = ['Todo lo de Free', 'Sesiones ilimitadas', 'Importaciones ilimitadas', 'AI Coach con historial real', 'Progresion automatica', 'Athlete Memory Engine completo', 'Soporte prioritario']
const PRO_FEATURES_EN = ['Everything in Free', 'Unlimited sessions', 'Unlimited imports', 'AI Coach with real history', 'Auto progression', 'Full Athlete Memory Engine', 'Priority support']

const BG = '#0A0A0F'
const CARD = '#111118'
const ACC = '#C8FF00'
const T1 = '#F0F0F5'
const T2 = '#8888AA'
const T3 = '#44445a'
const BORDER = '#1a1a2e'

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  const isEs = locale === 'es'

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'Inter, sans-serif', position: 'relative' }}>

      {/* Ambient glow top */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse at center top, rgba(200,255,0,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── NAV ── */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#C8FF00,#88DD00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: BG, fontFamily: 'Syne, sans-serif' }}>AIS</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: T1, letterSpacing: '-0.02em' }}>Athlete Intelligence</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href={locale === 'es' ? '/en' : '/es'} style={{ color: T3, fontSize: 12, fontWeight: 600, fontFamily: 'Syne, sans-serif', padding: '6px 12px' }}>
            {isEs ? 'EN' : 'ES'}
          </Link>
          <Link href={`/${locale}/login`} style={{ color: T2, fontSize: 13, fontWeight: 600, padding: '8px 16px', fontFamily: 'Syne, sans-serif' }}>
            {isEs ? 'Acceder' : 'Log in'}
          </Link>
          <Link href={`/${locale}/register`} style={{ background: ACC, color: BG, fontSize: 13, fontWeight: 800, padding: '10px 20px', borderRadius: 12, fontFamily: 'Syne, sans-serif', display: 'inline-block' }}>
            {isEs ? 'Empezar gratis' : 'Start free'}
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px 80px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACC, display: 'inline-block' }} />
          <span style={{ color: ACC, fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {isEs ? 'Para atletas de hipertrofia' : 'For hypertrophy athletes'}
          </span>
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 52, fontWeight: 800, color: T1, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 20 }}>
          {isEs ? 'El sistema operativo para tu hipertrofia' : 'The operating system for your hypertrophy'}
        </h1>
        <p style={{ fontSize: 18, color: T2, marginBottom: 10, lineHeight: 1.6 }}>
          {isEs ? 'Registra, importa, progresa. Con IA que conoce tu historial real.' : 'Log, import, progress. With AI that knows your real history.'}
        </p>
        <p style={{ fontSize: 13, color: T3, marginBottom: 40 }}>
          {isEs ? 'Gratis para siempre. Pro desde 14.99 EUR/mes.' : 'Free forever. Pro from EUR 14.99/month.'}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/${locale}/register`} style={{ background: 'linear-gradient(135deg,#C8FF00,#88DD00)', color: BG, fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, padding: '18px 36px', borderRadius: 16, display: 'inline-block', boxShadow: '0 8px 32px rgba(200,255,0,0.3)' }}>
            {isEs ? 'Empezar gratis' : 'Start free'}
          </Link>
          <Link href={`/${locale}/login`} style={{ background: CARD, color: T2, fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, padding: '18px 36px', borderRadius: 16, border: '1px solid ' + BORDER, display: 'inline-block' }}>
            {isEs ? 'Ya tengo cuenta' : 'I have an account'}
          </Link>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: T1, textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>
          {isEs ? 'Si entrenas en serio, esto te suena.' : 'If you train seriously, this sounds familiar.'}
        </h2>
        <p style={{ color: T3, fontSize: 14, textAlign: 'center', marginBottom: 40 }}>
          {isEs ? 'Cada atleta enfrenta los mismos problemas.' : 'Every athlete faces the same problems.'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {PROBLEMS.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '18px 20px', background: CARD, border: '1px solid ' + BORDER, borderRadius: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,107,0.12)', color: '#FF6B6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0, fontFamily: 'DM Mono, monospace' }}>{p.icon}</div>
              <p style={{ fontSize: 14, color: T2, lineHeight: 1.5, paddingTop: 2 }}>{isEs ? p.es : p.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: T1, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
          {isEs ? 'AIS lo resuelve todo.' : 'AIS solves all of it.'}
        </h2>
        <p style={{ fontSize: 14, color: T3, textAlign: 'center', marginBottom: 40 }}>
          {isEs ? 'No es otra app de series y reps. Es tu memoria deportiva con IA.' : 'Not another sets and reps app. It is your sports memory with AI.'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: '24px', background: CARD, border: '1px solid ' + BORDER, borderRadius: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(200,255,0,0.1)', color: ACC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>{f.icon}</div>
              <p style={{ fontWeight: 700, fontFamily: 'Syne, sans-serif', color: T1, fontSize: 16, marginBottom: 8 }}>{isEs ? f.es_title : f.en_title}</p>
              <p style={{ fontSize: 13, color: T3, lineHeight: 1.6 }}>{isEs ? f.es_desc : f.en_desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARATIVA ── */}
      <section style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: T1, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
          {isEs ? 'Comparado con la competencia.' : 'Compared to the competition.'}
        </h2>
        <p style={{ fontSize: 14, color: T3, textAlign: 'center', marginBottom: 32 }}>
          {isEs ? 'Mas funcionalidades. Mejor precio. Sin trampa.' : 'More features. Better price. No tricks.'}
        </p>
        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 20px', background: '#0d0d14', borderBottom: '1px solid ' + BORDER }}>
            {[isEs ? 'Caracteristica' : 'Feature', 'AIS', isEs ? 'App A (ciencia)' : 'App A (science)', isEs ? 'App B (clasica)' : 'App B (classic)'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Syne, sans-serif', color: i === 1 ? ACC : T3 }}>{h}</span>
            ))}
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T2 }}>{isEs ? row.feature_es : row.feature_en}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: ACC, fontFamily: 'DM Mono, monospace' }}>{row.ais}</span>
              <span style={{ fontSize: 13, color: T3 }}>{row.rp}</span>
              <span style={{ fontSize: 13, color: T3 }}>{row.jefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: '60px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: T1, textAlign: 'center', marginBottom: 40, letterSpacing: '-0.02em' }}>
          {isEs ? 'Precio transparente.' : 'Transparent pricing.'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Free */}
          <div style={{ padding: '28px 24px', background: CARD, border: '1px solid ' + BORDER, borderRadius: 22 }}>
            <p style={{ fontWeight: 700, fontSize: 18, color: T1, fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>Free</p>
            <p style={{ fontSize: 36, fontWeight: 700, color: T1, fontFamily: 'DM Mono, monospace', marginBottom: 24 }}>
              0<span style={{ fontSize: 16, color: T3 }}> EUR</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {(isEs ? FREE_FEATURES_ES : FREE_FEATURES_EN).map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: T2 }}>
                  <span style={{ color: ACC, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <Link href={`/${locale}/register`} style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 13, background: '#1a1a2e', color: T2, fontWeight: 700, fontFamily: 'Syne, sans-serif', fontSize: 14 }}>
              {isEs ? 'Empezar gratis' : 'Start free'}
            </Link>
          </div>
          {/* Pro */}
          <div style={{ padding: '28px 24px', background: 'linear-gradient(135deg, rgba(17,26,5,0.95), rgba(13,21,5,0.95))', border: '1px solid rgba(200,255,0,0.25)', borderRadius: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <p style={{ fontWeight: 700, fontSize: 18, color: T1, fontFamily: 'Syne, sans-serif' }}>Pro</p>
              <span style={{ background: ACC, color: BG, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100, fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em' }}>
                {isEs ? 'RECOMENDADO' : 'RECOMMENDED'}
              </span>
            </div>
            <p style={{ fontSize: 36, fontWeight: 700, color: ACC, fontFamily: 'DM Mono, monospace', marginBottom: 24 }}>
              14.99<span style={{ fontSize: 14, color: T3 }}> EUR/mes</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {(isEs ? PRO_FEATURES_ES : PRO_FEATURES_EN).map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#ccc' }}>
                  <span style={{ color: ACC, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <Link href={`/${locale}/register`} style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 13, background: 'linear-gradient(135deg,#C8FF00,#88DD00)', color: BG, fontWeight: 800, fontFamily: 'Syne, sans-serif', fontSize: 14, boxShadow: '0 4px 20px rgba(200,255,0,0.3)' }}>
              {isEs ? 'Empezar — 14.99 EUR/mes' : 'Start — EUR 14.99/month'}
            </Link>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: T3, marginTop: 16 }}>
          {isEs ? 'Cancela cuando quieras. Sin permanencia.' : 'Cancel anytime. No commitment.'}
        </p>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '80px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 38, fontWeight: 800, color: T1, marginBottom: 16, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {isEs ? 'Empieza hoy. Es gratis.' : 'Start today. It is free.'}
        </h2>
        <p style={{ fontSize: 14, color: T3, marginBottom: 32 }}>
          {isEs ? 'Sin tarjeta de credito. Sin trampa. Registrate en 30 segundos.' : 'No credit card. No tricks. Sign up in 30 seconds.'}
        </p>
        <Link href={`/${locale}/register`} style={{ display: 'inline-block', background: 'linear-gradient(135deg,#C8FF00,#88DD00)', color: BG, fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, padding: '20px 48px', borderRadius: 18, boxShadow: '0 8px 40px rgba(200,255,0,0.35)', letterSpacing: '0.02em' }}>
          {isEs ? 'Crear cuenta gratis' : 'Create free account'}
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid ' + BORDER, padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: T3 }}>AIS — Athlete Intelligence System · 2026</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
          {[
            { href: `/${locale}/login`, label: isEs ? 'Acceder' : 'Log in' },
            { href: `/${locale}/upgrade`, label: 'Pro' },
            { href: `/${locale}/register`, label: isEs ? 'Registrarse' : 'Sign up' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 12, color: T3, fontFamily: 'Syne, sans-serif' }}>{l.label}</Link>
          ))}
        </div>
      </footer>

    </div>
  )
}
