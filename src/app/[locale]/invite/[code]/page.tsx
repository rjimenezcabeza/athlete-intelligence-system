import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const BETA_CODES: Record<string, { name: string; slots: number }> = {
  'AIS2026': { name: 'Beta Tester', slots: 20 },
  'ATHLETE': { name: 'Athlete Beta', slots: 10 },
  'COACH01': { name: 'Coach Beta', slots: 5 },
}

interface Props {
  params: Promise<{ locale: string; code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'es' ? 'AIS — Acceso Beta Exclusivo' : 'AIS — Exclusive Beta Access',
    robots: { index: false }
  }
}

export default async function InvitePage({ params }: Props) {
  const { locale, code } = await params
  const isEs = locale === 'es'
  const upperCode = code.toUpperCase()
  const betaInfo = BETA_CODES[upperCode]

  if (!betaInfo) notFound()

  const accent = '#C8FF00'
  const dark = '#0A0A0F'

  return (
    <div style={{ background: dark, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ padding: '5px 14px', background: `${accent}15`, border: `1px solid ${accent}30`, borderRadius: '20px', fontSize: '11px', color: accent, fontFamily: 'DM Mono, monospace', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {isEs ? 'Acceso Beta Exclusivo' : 'Exclusive Beta Access'}
          </div>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: accent, fontFamily: 'Syne, sans-serif', marginBottom: '6px', letterSpacing: '-1px' }}>AIS</div>
          <div style={{ fontSize: '13px', color: '#555', fontFamily: 'DM Mono, monospace' }}>Athlete Intelligence System</div>
        </div>

        {/* Card principal */}
        <div style={{ padding: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', marginBottom: '16px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.3px' }}>
            {isEs ? 'Has sido invitado' : "You've been invited"}
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#888', lineHeight: '1.6' }}>
            {isEs
              ? 'Tienes acceso anticipado a AIS, el sistema operativo para atletas de hipertrofia. Regístrate con tu email y empieza hoy.'
              : 'You have early access to AIS, the operating system for hypertrophy athletes. Register with your email and start today.'}
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {[
              { icon: '🤖', text: isEs ? 'AI Coach con tu historial real' : 'AI Coach with your real history' },
              { icon: '📎', text: isEs ? 'Importa tu programa actual con IA' : 'Import your current program with AI' },
              { icon: '📊', text: isEs ? 'Motor de progresión doble automático' : 'Automatic double progression engine' },
              { icon: '📴', text: isEs ? 'Funciona sin conexión (PWA)' : 'Works offline (PWA)' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: '13px', color: '#aaa' }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <Link
            href={`/${locale}/register?code=${upperCode}`}
            style={{ display: 'block', textAlign: 'center', padding: '14px', background: accent, borderRadius: '12px', color: dark, fontSize: '15px', fontWeight: '800', textDecoration: 'none', fontFamily: 'Syne, sans-serif', marginBottom: '10px' }}
          >
            {isEs ? 'Crear cuenta gratuita' : 'Create free account'}
          </Link>
          <Link
            href={`/${locale}/login`}
            style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#888', fontSize: '13px', textDecoration: 'none', fontFamily: 'DM Mono, monospace' }}
          >
            {isEs ? 'Ya tengo cuenta' : 'I have an account'}
          </Link>
        </div>

        {/* Código visible */}
        <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
          <div style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isEs ? 'Código de invitación' : 'Invitation code'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#555', fontFamily: 'DM Mono, monospace', letterSpacing: '3px' }}>
            {upperCode}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#333', marginTop: '16px', fontFamily: 'DM Mono, monospace' }}>
          AIS Beta · {isEs ? 'Acceso limitado a ' : 'Limited to '}{betaInfo.slots} {isEs ? 'usuarios' : 'users'}
        </p>
      </div>
    </div>
  )
}
