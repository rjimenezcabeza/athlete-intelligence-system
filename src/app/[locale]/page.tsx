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
      ? 'AIS — Sistema operativo para atletas de hipertrofia | Gratis'
      : 'AIS — Operating system for hypertrophy athletes | Free',
    description: isEs
      ? 'Importa tu programa con IA, registra en 5 segundos, progresion automatica. AI Coach con tu historial real. 7 rutinas predefinidas. Gratis.'
      : 'Import your program with AI, log in 5 seconds, automatic progression. AI Coach with your real history. 7 preset routines. Free.',
    openGraph: {
      title: isEs ? 'AIS — Tu memoria deportiva con IA' : 'AIS — Your sports memory with AI',
      description: isEs
        ? 'No es otra app de series y reps. Es el sistema que recuerda todo sobre tu entrenamiento.'
        : 'Not another sets and reps app. It is the system that remembers everything about your training.',
    },
    robots: { index: true, follow: true },
  }
}

const PAIN_POINTS = [
  { icon: 'N', es: 'Llevas el entreno en papel o en la cabeza', en: 'You track workouts on paper or from memory' },
  { icon: '?', es: 'No recuerdas que peso usaste la semana pasada', en: 'You cannot remember last week\'s weight' },
  { icon: '~', es: 'No sabes si realmente estas progresando', en: 'You don\'t know if you are actually progressing' },
  { icon: '$', es: 'Las apps buenas cuestan 25-35 EUR al mes', en: 'Good apps cost 25-35 EUR per month' },
]

const FEATURES = [
  {
    icon: 'AI',
    es_title: 'Importador IA',
    en_title: 'AI Importer',
    es_desc: 'Foto del cuaderno, PDF o Excel. La IA extrae ejercicios, pesos, nutricion y series automaticamente. Unico en el mercado.',
    en_desc: 'Photo of notebook, PDF or Excel. AI extracts exercises, weights, nutrition and sets automatically. Unique in the market.',
    badge: 'EXCLUSIVO'
  },
  {
    icon: '>>',
    es_title: 'Motor de Progresion',
    en_title: 'Progression Engine',
    es_desc: 'Doble progresion, RIR, Top Set. El sistema calcula exactamente cuando subir peso basandose en tu historial real.',
    en_desc: 'Double progression, RIR, Top Set. The system calculates exactly when to increase weight based on your real history.',
    badge: null
  },
  {
    icon: 'IC',
    es_title: 'AI Coach con Memoria',
    en_title: 'AI Coach with Memory',
    es_desc: 'Tu Coach conoce cada sesion, cada PR, cada estancamiento. Analisis profundo desde el primer mensaje.',
    en_desc: 'Your Coach knows every session, every PR, every stall. Deep analysis from the first message.',
    badge: 'EXCLUSIVO'
  },
  {
    icon: 'M',
    es_title: 'Mesociclos + Volumen',
    en_title: 'Mesocycles + Volume',
    es_desc: 'Bloques de 4-12 semanas, semana X de Y, volumen por musculo con semaforo MEV/MAV/MRV.',
    en_desc: '4-12 week blocks, week X of Y, muscle volume with MEV/MAV/MRV traffic light.',
    badge: null
  },
  {
    icon: '7R',
    es_title: '7 Rutinas Predefinidas',
    en_title: '7 Preset Routines',
    es_desc: 'PPL, Upper/Lower, Torso/Pierna, Full Body, Bro Split, Arnold Split. Listas para empezar hoy.',
    en_desc: 'PPL, Upper/Lower, Torso/Leg, Full Body, Bro Split, Arnold Split. Ready to start today.',
    badge: null
  },
  {
    icon: 'OFF',
    es_title: 'Funciona Sin Red',
    en_title: 'Works Offline',
    es_desc: 'PWA nativa. Registra en el gym aunque no tengas cobertura. Los datos se sincronizan solos.',
    en_desc: 'Native PWA. Log at the gym even without signal. Data syncs automatically.',
    badge: 'EXCLUSIVO'
  },
]

const COMPARISON = [
  { es: 'Precio mensual', en: 'Monthly price', ais: 'Gratis / 14.99EUR', rp: '25-35EUR', jefit: '19.99EUR', alpha: '8.99EUR' },
  { es: 'Importar cuadernos con IA', en: 'Import notebooks with AI', ais: 'Si', rp: 'No', jefit: 'No', alpha: 'No' },
  { es: 'AI Coach con historial real', en: 'AI Coach with real history', ais: 'Si', rp: 'No', jefit: 'No', alpha: 'No' },
  { es: 'Funciona offline', en: 'Works offline', ais: 'Si', rp: 'No', jefit: 'No', alpha: 'No' },
  { es: 'Volumen MEV/MAV/MRV', en: 'MEV/MAV/MRV volume', ais: 'Si', rp: 'Si', jefit: 'No', alpha: 'Si' },
  { es: 'Motor progresion doble', en: 'Double progression', ais: 'Si', rp: 'Si', jefit: 'No', alpha: 'Si' },
  { es: 'Mesocycle builder', en: 'Mesocycle builder', ais: 'Si', rp: 'Si', jefit: 'No', alpha: 'Si' },
  { es: 'Idiomas', en: 'Languages', ais: '6 idiomas', rp: 'Solo EN', jefit: 'Solo EN', alpha: 'Solo EN' },
]

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  const isEs = locale === 'es'

  const accentGreen = '#C8FF00'
  const bgDark = '#0A0A0F'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.08)'

  return (
    <div style={{ background: bgDark, minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', color: accentGreen, fontFamily: 'Syne, sans-serif' }}>AIS</span>
          <span style={{ fontSize: '11px', color: '#444', fontFamily: 'DM Mono, monospace' }}>Athlete Intelligence System</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href={locale === 'es' ? '/en' : '/es'} style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>
            {isEs ? 'EN' : 'ES'}
          </Link>
          <Link href={`/${locale}/login`} style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>
            {isEs ? 'Acceder' : 'Log in'}
          </Link>
          <Link href={`/${locale}/register`} style={{ fontSize: '13px', fontWeight: '700', padding: '8px 16px', background: accentGreen, color: bgDark, borderRadius: '10px', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>
            {isEs ? 'Empezar gratis' : 'Start free'}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '60px 24px 40px', maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '5px 12px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: '20px', fontSize: '11px', color: accentGreen, fontFamily: 'DM Mono, monospace', letterSpacing: '1px', marginBottom: '24px', textTransform: 'uppercase' }}>
          {isEs ? 'Para atletas de hipertrofia' : 'For hypertrophy athletes'}
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 5.5vw, 58px)', fontWeight: '800', lineHeight: '1.1', marginBottom: '20px', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'La app que recuerda todo' : 'The app that remembers everything'}
          <br />
          <span style={{ color: accentGreen }}>{isEs ? 'sobre tu entrenamiento' : 'about your training'}</span>
        </h1>

        <p style={{ fontSize: '17px', color: '#888', marginBottom: '12px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 12px' }}>
          {isEs
            ? 'Importa cualquier programa con IA, registra en 5 segundos, y recibe analisis personalizados de tu Coach que conoce tu historial completo.'
            : 'Import any program with AI, log in 5 seconds, and get personalized analysis from your Coach who knows your complete history.'}
        </p>
        <p style={{ fontSize: '13px', color: '#555', marginBottom: '36px' }}>
          {isEs ? 'Gratis. Sin tarjeta de credito. Empieza en 60 segundos.' : 'Free. No credit card. Start in 60 seconds.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/${locale}/register`} style={{ padding: '15px 30px', background: accentGreen, color: bgDark, borderRadius: '14px', fontWeight: '800', fontSize: '16px', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>
            {isEs ? 'Crear cuenta gratis' : 'Create free account'}
          </Link>
          <Link href={`/${locale}/login`} style={{ padding: '15px 30px', background: 'rgba(255,255,255,0.06)', color: '#aaa', borderRadius: '14px', fontWeight: '600', fontSize: '16px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            {isEs ? 'Ya tengo cuenta' : 'I have an account'}
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '48px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px' }}>
          {[
            { n: '7', label: isEs ? 'Rutinas incluidas' : 'Routines included' },
            { n: '166', label: isEs ? 'Ejercicios en DB' : 'Exercises in DB' },
            { n: '6', label: isEs ? 'Idiomas' : 'Languages' },
            { n: '0EUR', label: isEs ? 'Para empezar' : 'To start' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: accentGreen, fontFamily: 'DM Mono, monospace' }}>{s.n}</div>
              <div style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PAIN POINTS */}
      <section style={{ padding: '40px 24px', maxWidth: '860px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', textAlign: 'center', marginBottom: '28px', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Si esto te suena, AIS es para ti.' : 'If this sounds familiar, AIS is for you.'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {PAIN_POINTS.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px', background: cardBg, border: cardBorder, borderRadius: '12px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,100,100,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#FF6B6B', fontFamily: 'DM Mono, monospace', fontWeight: '700', flexShrink: 0 }}>
                {p.icon}
              </div>
              <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>{isEs ? p.es : p.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '60px 24px', maxWidth: '1060px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Syne, sans-serif', marginBottom: '10px' }}>
            {isEs ? 'Todo lo que necesitas.' : 'Everything you need.'}
          </h2>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {isEs ? 'No es otra app de series y reps. Es tu memoria deportiva con IA.' : 'Not another sets and reps app. It\'s your sports memory with AI.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: '22px', background: cardBg, border: cardBorder, borderRadius: '14px', position: 'relative' }}>
              {f.badge && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '2px 7px', background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: '4px', fontSize: '9px', color: accentGreen, fontFamily: 'DM Mono, monospace', letterSpacing: '0.5px' }}>
                  {f.badge}
                </div>
              )}
              <div style={{ width: '36px', height: '36px', background: 'rgba(200,255,0,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: accentGreen, fontFamily: 'DM Mono, monospace', marginBottom: '12px' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: '6px', paddingRight: f.badge ? '60px' : '0' }}>
                {isEs ? f.es_title : f.en_title}
              </h3>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5', margin: 0 }}>
                {isEs ? f.es_desc : f.en_desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARATIVA */}
      <section style={{ padding: '60px 24px', maxWidth: '860px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', textAlign: 'center', marginBottom: '8px', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'AIS vs la competencia' : 'AIS vs the competition'}
        </h2>
        <p style={{ textAlign: 'center', color: '#555', fontSize: '13px', marginBottom: '28px' }}>
          {isEs ? 'Mas funcionalidades. Mejor precio. Tres exclusivos.' : 'More features. Better price. Three exclusives.'}
        </p>

        <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 14px', background: 'rgba(255,255,255,0.05)' }}>
            {['', 'AIS', 'RP', 'Jefit', 'Alpha'].map((h, i) => (
              <span key={i} style={{ fontSize: '11px', fontWeight: '700', color: i === 1 ? accentGreen : '#555', fontFamily: 'DM Mono, monospace', textAlign: i > 0 ? 'center' : 'left', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '9px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>{isEs ? row.es : row.en}</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: accentGreen, textAlign: 'center' }}>{row.ais}</span>
              <span style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>{row.rp}</span>
              <span style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>{row.jefit}</span>
              <span style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>{row.alpha}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '60px 24px', maxWidth: '720px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', textAlign: 'center', marginBottom: '36px', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Precio transparente.' : 'Transparent pricing.'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>

          {/* FREE */}
          <div style={{ padding: '26px', background: cardBg, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px' }}>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Free</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '18px' }}>
              <span style={{ fontSize: '36px', fontWeight: '800', color: '#fff', fontFamily: 'DM Mono, monospace' }}>0EUR</span>
              <span style={{ color: '#555', fontSize: '13px' }}>/mes</span>
            </div>
            {(isEs
              ? ['Registro de entrenamientos', '30 sesiones/mes', '3 importaciones IA/mes', '7 rutinas predefinidas']
              : ['Workout logging', '30 sessions/month', '3 AI imports/month', '7 preset routines']
            ).map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px' }}>
                <span style={{ color: accentGreen, fontSize: '11px' }}>✓</span>
                <span style={{ fontSize: '12px', color: '#888' }}>{f}</span>
              </div>
            ))}
            <Link href={`/${locale}/register`} style={{ display: 'block', textAlign: 'center', padding: '11px', marginTop: '18px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#aaa', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
              {isEs ? 'Empezar gratis' : 'Start free'}
            </Link>
          </div>

          {/* PRO */}
          <div style={{ padding: '26px', background: 'rgba(200,255,0,0.04)', border: '2px solid rgba(200,255,0,0.22)', borderRadius: '18px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', padding: '3px 10px', background: accentGreen, borderRadius: '8px', fontSize: '9px', fontWeight: '800', color: bgDark, fontFamily: 'Syne, sans-serif', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
              {isEs ? 'RECOMENDADO' : 'RECOMMENDED'}
            </div>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Pro</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '18px' }}>
              <span style={{ fontSize: '36px', fontWeight: '800', color: accentGreen, fontFamily: 'DM Mono, monospace' }}>14.99EUR</span>
              <span style={{ color: '#555', fontSize: '13px' }}>/mes</span>
            </div>
            {(isEs
              ? ['Todo lo de Free', 'Sesiones ilimitadas', 'Importaciones ilimitadas', 'AI Coach con historial real', 'Progresion automatica', 'Mesocycle builder completo']
              : ['Everything in Free', 'Unlimited sessions', 'Unlimited imports', 'AI Coach with real history', 'Auto progression', 'Full mesocycle builder']
            ).map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px' }}>
                <span style={{ color: accentGreen, fontSize: '11px' }}>✓</span>
                <span style={{ fontSize: '12px', color: '#ccc' }}>{f}</span>
              </div>
            ))}
            <Link href={`/${locale}/register`} style={{ display: 'block', textAlign: 'center', padding: '13px', marginTop: '18px', background: accentGreen, borderRadius: '10px', color: bgDark, fontSize: '14px', fontWeight: '800', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>
              {isEs ? 'Empezar — 14.99EUR/mes' : 'Start — EUR14.99/month'}
            </Link>
            <p style={{ textAlign: 'center', fontSize: '10px', color: '#555', marginTop: '6px' }}>
              {isEs ? 'Cancela cuando quieras' : 'Cancel anytime'}
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '60px 24px 80px', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Syne, sans-serif', marginBottom: '14px' }}>
          {isEs ? 'Empieza hoy. Es gratis.' : 'Start today. It\'s free.'}
        </h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px', lineHeight: '1.6' }}>
          {isEs
            ? 'Sin tarjeta. Sin compromiso. Registrate en 60 segundos.'
            : 'No card. No commitment. Sign up in 60 seconds.'}
        </p>
        <Link href={`/${locale}/register`} style={{ display: 'inline-block', padding: '16px 44px', background: accentGreen, color: bgDark, borderRadius: '14px', fontWeight: '800', fontSize: '17px', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Crear cuenta gratis' : 'Create free account'}
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '22px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '22px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {[
            { href: `/${locale}/login`, label: isEs ? 'Acceder' : 'Log in' },
            { href: `/${locale}/register`, label: isEs ? 'Registro' : 'Register' },
            { href: `/${locale}/upgrade`, label: 'Pro' },
            { href: locale === 'es' ? '/en' : '/es', label: isEs ? 'English' : 'Espanol' },
          ].map((l, i) => (
            <Link key={i} href={l.href} style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: '#333', margin: 0 }}>AIS — Athlete Intelligence System 2026</p>
      </footer>

    </div>
  )
}
