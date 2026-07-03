'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'

const BG     = 'var(--bg-primary,#0A0A0F)'
const CARD   = 'var(--card-bg,rgba(255,255,255,0.04))'
const BORDER = 'var(--card-border,rgba(255,255,255,0.08))'
const T1     = 'var(--text-primary,#fff)'
const T2     = 'var(--text-secondary,#888)'
const T3     = 'var(--text-tertiary,#44445a)'

const DAYS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const DAYS_EN   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Readiness arc (SVG) ──────────────────────────────────────────
function ReadinessArc({ value, accent }: { value: number; accent: string }) {
  const R = 70, STROKE = 10
  const circumference = Math.PI * R          // half-circle arc
  const pct = (value - 1) / 9
  const dashOffset = circumference * (1 - pct)
  const color = value >= 8 ? accent : value >= 5 ? '#F59E0B' : '#FF6B6B'
  const label = value >= 8 ? 'ÓPTIMO' : value >= 5 ? 'BUENO' : 'BAJO'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      <svg width={160} height={90} viewBox="0 0 160 90" style={{ overflow: 'visible' }}>
        {/* Track */}
        <path
          d={`M ${STROKE} 80 A ${R} ${R} 0 0 1 ${160 - STROKE} 80`}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${STROKE} 80 A ${R} ${R} 0 0 1 ${160 - STROKE} 80`}
          fill="none" stroke={color} strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s' }}
        />
      </svg>
      <div style={{ marginTop: -48, textAlign: 'center' }}>
        <div style={{ fontSize: 52, fontWeight: 900, fontFamily: 'DM Mono, monospace', color, lineHeight: 1, letterSpacing: '-0.04em', transition: 'color 0.3s' }}>
          {value}
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color, fontFamily: 'Syne, sans-serif', marginTop: 4, opacity: 0.75 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

// ── Dot row selector (1–10 or 1–5) ─────────────────────────────
function DotSelector({ value, onChange, count = 10, color = '#C8FF00' }: {
  value: number; onChange: (v: number) => void; count?: number; color?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: count }, (_, i) => i + 1).map(n => {
        const active = n <= value
        return (
          <button key={n} onClick={() => onChange(n)} style={{
            width: count <= 5 ? 42 : 26, height: count <= 5 ? 42 : 26,
            borderRadius: count <= 5 ? 12 : 8,
            background: active ? color + '25' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${active ? color + '60' : 'rgba(255,255,255,0.07)'}`,
            color: active ? color : '#333355',
            fontSize: count <= 5 ? 15 : 10, fontWeight: 800,
            fontFamily: 'DM Mono, monospace',
            cursor: 'pointer', transition: 'all 0.12s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: n === value ? `0 0 8px ${color}30` : 'none',
          }}>{n}</button>
        )
      })}
    </div>
  )
}

export default function NewSessionPage() {
  const params   = useParams()
  const router   = useRouter()
  const locale   = (params?.locale as string) ?? 'es'
  const isEs     = locale === 'es'
  const { accentColor } = useTheme()

  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [readiness, setReadiness] = useState(7)
  const [sleep, setSleep]         = useState(7)
  const [stress, setStress]       = useState(4)
  const [bodyWeight, setBodyWeight] = useState('')
  const [stats, setStats]         = useState<any>(null)

  const now      = new Date()
  const hour     = now.getHours()
  const greeting = isEs
    ? (hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches')
    : (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
  const dayName   = isEs ? DAYS_ES[now.getDay()] : DAYS_EN[now.getDay()]
  const monthName = isEs ? MONTHS_ES[now.getMonth()] : MONTHS_EN[now.getMonth()]
  const dateStr   = isEs
    ? `${dayName} ${now.getDate()} ${monthName}`
    : `${dayName}, ${monthName} ${now.getDate()}`

  useEffect(() => {
    // Redirect to existing active session if one exists
    fetch('/api/sessions/active').then(r => r.json()).then(d => {
      if (d.session?.id) router.replace(`/${locale}/session/${d.session.id}`)
    }).catch(() => {})
    fetch('/api/dashboard/summary').then(r => r.json()).then(d => {
      if (!d.error) setStats(d)
    }).catch(() => {})
  }, [locale, router])

  const startSession = async () => {
    setLoading(true); setError(null)
    try {
      const body: Record<string, unknown> = {
        session_date: now.toISOString().split('T')[0],
        readiness_score: readiness,
        sleep_quality: sleep,
        stress_level: stress,
      }
      if (bodyWeight) body.body_weight_kg = parseFloat(bodyWeight)
      const res = await fetch('/api/sessions/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error starting session')
      router.push(`/${locale}/session/${data.session.id}`)
    } catch (e: any) {
      setError(e.message); setLoading(false)
    }
  }

  const readinessColor = readiness >= 8 ? accentColor : readiness >= 5 ? '#F59E0B' : '#FF6B6B'

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, maxWidth: 480, margin: '0 auto', paddingBottom: 120 }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .tap-scale:active { transform: scale(0.97); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '44px 24px 16px', animation: 'fadeUp .3s ease-out' }}>
        <p style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', margin: '0 0 5px' }}>
          {dateStr.toUpperCase()}
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: T1, margin: 0, lineHeight: 1.2 }}>
          {greeting} 💪
        </h1>
      </div>

      {/* ── Mini stats strip ── */}
      {stats && (
        <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px', animation: 'fadeUp .35s ease-out .05s both' }}>
          {[
            { label: isEs ? 'Racha' : 'Streak', value: `${stats.current_streak ?? 0}w`, icon: '🔥' },
            { label: isEs ? 'Esta sem.' : 'This week', value: `${stats.sessions_this_week ?? 0} sess.`, icon: '📅' },
            { label: isEs ? 'Últ. vol.' : 'Last vol.', value: stats.last_session_volume ? `${Math.round(stats.last_session_volume)}kg` : '—', icon: '📦' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: '1 0 0', background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T1, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── CHECK-IN CARD ── */}
      <div style={{ margin: '0 16px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '24px 20px', animation: 'fadeUp .4s ease-out .1s both' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T3, fontFamily: 'Syne, sans-serif', margin: '0 0 20px', textAlign: 'center' }}>
          {isEs ? 'CHECK-IN DIARIO' : 'DAILY CHECK-IN'}
        </p>

        {/* ── Readiness arc ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 10, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            ⚡ {isEs ? 'Readiness' : 'Readiness'}
          </p>
          <ReadinessArc value={readiness} accent={accentColor} />
          <div style={{ marginTop: 4, width: '100%' }}>
            <DotSelector value={readiness} onChange={setReadiness} count={10} color={readinessColor} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 5 }}>
            <span style={{ fontSize: 9, color: T3, fontFamily: 'DM Mono, monospace' }}>{isEs ? 'Agotado' : 'Exhausted'}</span>
            <span style={{ fontSize: 9, color: T3, fontFamily: 'DM Mono, monospace' }}>{isEs ? 'Listo' : 'Ready'}</span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />

        {/* ── Sleep + Stress in 2 columns ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Sleep */}
          <div>
            <p style={{ fontSize: 10, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px', textAlign: 'center' }}>
              😴 {isEs ? 'Sueño' : 'Sleep'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#60A5FA', fontFamily: 'DM Mono, monospace' }}>{sleep}</span>
              <span style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono, monospace' }}>/10</span>
            </div>
            <DotSelector value={sleep} onChange={setSleep} count={10} color="#60A5FA" />
          </div>

          {/* Stress */}
          <div>
            <p style={{ fontSize: 10, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px', textAlign: 'center' }}>
              🧘 {isEs ? 'Estrés' : 'Stress'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: stress >= 7 ? '#FF6B6B' : '#10B981', fontFamily: 'DM Mono, monospace', transition: 'color 0.3s' }}>{stress}</span>
              <span style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono, monospace' }}>/10</span>
            </div>
            <DotSelector value={stress} onChange={setStress} count={10} color={stress >= 7 ? '#FF6B6B' : '#10B981'} />
          </div>
        </div>

        {/* ── Peso corporal ── */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 10, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px', textAlign: 'center' }}>
            ⚖️ {isEs ? 'Peso corporal (opcional)' : 'Body weight (optional)'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <input
              type="number" value={bodyWeight}
              onChange={e => setBodyWeight(e.target.value)}
              placeholder="—" inputMode="decimal"
              style={{
                width: 90, padding: '10px 12px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${bodyWeight ? accentColor + '50' : BORDER}`,
                color: T1, fontSize: 22, fontFamily: 'DM Mono, monospace',
                outline: 'none', textAlign: 'center', transition: 'border-color 0.2s',
                WebkitAppearance: 'none', MozAppearance: 'textfield',
              }}
            />
            <span style={{ color: T3, fontSize: 14, fontFamily: 'DM Mono, monospace' }}>kg</span>
          </div>
        </div>
      </div>

      {/* ── Contextual tip ── */}
      {readiness <= 4 && (
        <div style={{ margin: '12px 16px 0', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.18)', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, animation: 'fadeUp .3s ease-out' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <p style={{ margin: 0, fontSize: 12, color: '#FF6B6B', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
            {isEs ? 'Readiness bajo. Considera reducir la intensidad o descansar.' : 'Low readiness. Consider reducing intensity or resting.'}
          </p>
        </div>
      )}
      {readiness >= 9 && (
        <div style={{ margin: '12px 16px 0', background: accentColor + '09', border: `1px solid ${accentColor}25`, borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, animation: 'fadeUp .3s ease-out' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🚀</span>
          <p style={{ margin: 0, fontSize: 12, color: accentColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
            {isEs ? 'Condiciones óptimas. Ideal para PRs y sobrecarga progresiva.' : 'Peak conditions. Ideal for PRs and progressive overload.'}
          </p>
        </div>
      )}
      {stress >= 8 && (
        <div style={{ margin: '12px 16px 0', background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, animation: 'fadeUp .3s ease-out' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🧘</span>
          <p style={{ margin: 0, fontSize: 12, color: '#FF8080', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
            {isEs ? 'Estrés elevado. El cortisol alto afecta la recuperación — prioriza técnica sobre carga.' : 'High stress. Elevated cortisol affects recovery — prioritize technique over load.'}
          </p>
        </div>
      )}

      {/* ── CTAs ── */}
      <div style={{ padding: '20px 16px 0', animation: 'fadeUp .4s ease-out .15s both' }}>
        {error && (
          <p style={{ fontSize: 13, color: '#FF6B6B', marginBottom: 12, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
            {error}
          </p>
        )}
        <button className="tap-scale" onClick={startSession} disabled={loading} style={{
          width: '100%', padding: '18px 24px',
          background: loading ? `${accentColor}44` : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
          color: '#0A0A0F', border: 'none', borderRadius: 18,
          fontSize: 16, fontWeight: 800, fontFamily: 'Syne, sans-serif',
          cursor: loading ? 'default' : 'pointer', letterSpacing: '0.05em',
          boxShadow: loading ? 'none' : `0 6px 24px ${accentColor}35`,
          transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? (isEs ? 'Iniciando...' : 'Starting...') : (isEs ? '⚡ INICIAR ENTRENAMIENTO' : '⚡ START WORKOUT')}
        </button>
        <button className="tap-scale" onClick={() => router.push(`/${locale}/training/templates`)} style={{
          width: '100%', marginTop: 10, padding: '14px 24px',
          background: 'transparent', color: T2, border: `1.5px solid ${BORDER}`,
          borderRadius: 16, fontSize: 14, fontWeight: 600,
          fontFamily: 'Syne, sans-serif', cursor: 'pointer', letterSpacing: '0.02em',
          transition: 'all 0.2s',
        }}>
          {isEs ? '📋 Usar plantilla' : '📋 Use template'}
        </button>
      </div>

      {/* ── Science insight ── */}
      <div style={{ margin: '18px 16px 0', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, borderLeft: `3px solid ${accentColor}50` }}>
        <p style={{ fontSize: 9, color: T3, fontFamily: 'DM Mono, monospace', marginBottom: 4, letterSpacing: '0.08em' }}>
          💡 {isEs ? 'CIENCIA DEL ENTRENAMIENTO' : 'TRAINING SCIENCE'}
        </p>
        <p style={{ fontSize: 12, color: T2, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
          {stress >= 7
            ? (isEs ? 'El estrés elevado aumenta el cortisol, afectando la recuperación muscular. Prioriza la técnica sobre la intensidad hoy.' : 'High stress elevates cortisol, affecting muscle recovery. Prioritize technique over intensity today.')
            : readiness >= 7
            ? (isEs ? 'Con alta readiness, tu SNC está preparado para adaptaciones máximas. Momento ideal para sobrecarga progresiva.' : 'With high readiness, your CNS is primed for maximum adaptations. Ideal time for progressive overload.')
            : (isEs ? 'La consistencia supera a la intensidad. Un entrenamiento moderado hoy es mejor que ninguno.' : 'Consistency beats intensity. A moderate workout today is better than none.')
          }
        </p>
      </div>
    </div>
  )
}
