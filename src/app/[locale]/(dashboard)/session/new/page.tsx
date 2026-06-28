'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'

const ACC = 'var(--accent-color)'
const BG = 'var(--bg-primary)'
const CARD = 'var(--card-bg)'
const BORDER = 'var(--card-border)'
const T1 = 'var(--text-primary)'
const T2 = 'var(--text-secondary)'
const T3 = 'var(--text-tertiary)'

function RatingSlider({ label, emoji, value, onChange, lowLabel, highLabel }: {
  label: string; emoji: string; value: number; onChange: (v: number) => void;
  lowLabel?: string; highLabel?: string
}) {
  const { accentColor } = useTheme()
  const pct = ((value - 1) / 9) * 100
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 14, color: T1, fontFamily: 'Syne, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{emoji}</span> {label}
        </span>
        <span style={{ fontSize: 20, fontWeight: 800, color: accentColor, fontFamily: 'DM Mono, monospace', minWidth: 28, textAlign: 'right' }}>{value}</span>
      </div>
      <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', borderRadius: 3, background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`, transition: 'width 0.1s' }} />
        <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer', height: '100%' }} />
      </div>
      {(lowLabel || highLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono, monospace' }}>{lowLabel}</span>
          <span style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono, monospace' }}>{highLabel}</span>
        </div>
      )}
    </div>
  )
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function NewSessionPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const { accentColor } = useTheme()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readiness, setReadiness] = useState(7)
  const [sleep, setSleep] = useState(7)
  const [stress, setStress] = useState(4)
  const [bodyWeight, setBodyWeight] = useState('')
  const [stats, setStats] = useState<any>(null)

  const now = new Date()
  const hour = now.getHours()
  const greeting = isEs
    ? (hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches')
    : (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')

  const dayName = isEs ? DAYS_ES[now.getDay()] : DAYS_EN[now.getDay()]
  const monthName = isEs ? MONTHS_ES[now.getMonth()] : MONTHS_EN[now.getMonth()]
  const dateStr = isEs
    ? `${dayName} ${now.getDate()} ${monthName}`
    : `${dayName}, ${monthName} ${now.getDate()}`

  useEffect(() => {
    fetch('/api/dashboard/summary').then(r => r.json()).then(d => {
      if (!d.error) setStats(d)
    }).catch(() => {})
  }, [])

  const readinessLabel = readiness >= 8 ? (isEs ? 'ÓPTIMO' : 'OPTIMAL')
    : readiness >= 5 ? (isEs ? 'BUENO' : 'GOOD')
    : (isEs ? 'BAJO' : 'LOW')
  const readinessColor = readiness >= 8 ? accentColor : readiness >= 5 ? '#F59E0B' : '#FF6B6B'

  const startSession = async () => {
    setLoading(true)
    setError(null)
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
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error starting session')
      router.push(`/${locale}/session/${data.session.id}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{ padding: '32px 24px 20px' }}>
        <p style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', marginBottom: 6 }}>
          {dateStr.toUpperCase()}
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: T1, margin: 0, lineHeight: 1.2 }}>
          {greeting} 💪
        </h1>
        <p style={{ fontSize: 14, color: T2, marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
          {isEs ? 'Configura tu sesión de hoy' : "Set up today's session"}
        </p>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div style={{ display: 'flex', gap: 10, padding: '0 24px 20px', overflowX: 'auto' as const, scrollbarWidth: 'none' as const }}>
          {[
            { label: isEs ? 'Racha' : 'Streak', value: `${stats.current_streak ?? 0}d`, icon: '🔥' },
            { label: isEs ? 'Semana' : 'Week', value: `${stats.sessions_this_week ?? 0}`, icon: '📅' },
            { label: isEs ? 'Últ. vol.' : 'Last vol.', value: stats.last_session_volume ? `${Math.round(stats.last_session_volume)}kg` : '—', icon: '📦' },
          ].map((s, i) => (
            <div key={i} style={{ flex: '1 0 0', minWidth: 80, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 12px 10px' }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T1, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Check-in card ── */}
      <div style={{ margin: '0 24px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T3, fontFamily: 'Syne, sans-serif', margin: 0 }}>
            {isEs ? 'CHECK-IN DIARIO' : 'DAILY CHECK-IN'}
          </p>
          <span style={{
            padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800,
            fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em',
            background: readinessColor + '20', color: readinessColor,
            border: `1px solid ${readinessColor}40`,
          }}>{readinessLabel}</span>
        </div>

        <RatingSlider label={isEs ? 'Readiness' : 'Readiness'} emoji="⚡" value={readiness} onChange={setReadiness}
          lowLabel={isEs ? 'Agotado' : 'Exhausted'} highLabel={isEs ? 'Listo' : 'Ready'} />
        <RatingSlider label={isEs ? 'Calidad sueño' : 'Sleep quality'} emoji="😴" value={sleep} onChange={setSleep}
          lowLabel={isEs ? 'Muy mal' : 'Very poor'} highLabel={isEs ? 'Excelente' : 'Excellent'} />
        <RatingSlider label={isEs ? 'Nivel de estrés' : 'Stress level'} emoji="🧘" value={stress} onChange={setStress}
          lowLabel={isEs ? 'Sin estrés' : 'No stress'} highLabel={isEs ? 'Muy alto' : 'Very high'} />

        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: T3, fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>
            {isEs ? 'Peso corporal (opcional)' : 'Body weight (optional)'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={bodyWeight} onChange={e => setBodyWeight(e.target.value)} placeholder="—"
              style={{ width: 80, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${BORDER}`, color: T1, fontSize: 16, fontFamily: 'DM Mono, monospace', outline: 'none', textAlign: 'center' as const }} />
            <span style={{ color: T3, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>kg</span>
          </div>
        </div>
      </div>

      {/* ── Readiness tip ── */}
      {readiness <= 4 && (
        <div style={{ margin: '12px 24px 0', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FF6B6B', fontFamily: 'Syne, sans-serif', marginBottom: 2 }}>{isEs ? 'Readiness bajo' : 'Low readiness'}</p>
            <p style={{ fontSize: 12, color: T2, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              {isEs ? 'Considera reducir la intensidad hoy. El descanso también es progreso.' : 'Consider reducing intensity today. Rest is also progress.'}
            </p>
          </div>
        </div>
      )}
      {readiness >= 9 && (
        <div style={{ margin: '12px 24px 0', background: accentColor + '10', border: `1px solid ${accentColor}30`, borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🚀</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: accentColor, fontFamily: 'Syne, sans-serif', marginBottom: 2 }}>{isEs ? '¡Condiciones óptimas!' : 'Peak conditions!'}</p>
            <p style={{ fontSize: 12, color: T2, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              {isEs ? 'Perfecto para PRs y sobrecarga progresiva. Aprovecha el día.' : 'Perfect for PRs and progressive overload. Make the most of today.'}
            </p>
          </div>
        </div>
      )}

      {/* ── CTAs ── */}
      <div style={{ padding: '20px 24px 0' }}>
        {error && <p style={{ fontSize: 13, color: '#FF6B6B', marginBottom: 12, textAlign: 'center' as const, fontFamily: 'Inter, sans-serif' }}>{error}</p>}
        <button onClick={startSession} disabled={loading} style={{
          width: '100%', padding: '18px 24px',
          background: loading ? `${accentColor}44` : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          color: '#0A0A0F', border: 'none', borderRadius: 18,
          fontSize: 16, fontWeight: 800, fontFamily: 'Syne, sans-serif',
          cursor: loading ? 'default' : 'pointer', letterSpacing: '0.04em',
          boxShadow: loading ? 'none' : `0 4px 20px ${accentColor}40`,
          transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? (isEs ? 'Iniciando...' : 'Starting...') : (isEs ? '⚡ INICIAR ENTRENAMIENTO' : '⚡ START WORKOUT')}
        </button>
        <button onClick={() => router.push(`/${locale}/training/templates`)} style={{
          width: '100%', marginTop: 12, padding: '14px 24px',
          background: 'transparent', color: T2, border: `1.5px solid ${BORDER}`,
          borderRadius: 16, fontSize: 14, fontWeight: 600,
          fontFamily: 'Syne, sans-serif', cursor: 'pointer', letterSpacing: '0.02em',
        }}>
          {isEs ? '📋 Usar plantilla' : '📋 Use template'}
        </button>
      </div>

      {/* ── Science insight ── */}
      <div style={{ margin: '18px 24px 0', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, borderLeft: `3px solid ${accentColor}60` }}>
        <p style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono, monospace', marginBottom: 4, letterSpacing: '0.08em' }}>
          💡 {isEs ? 'CIENCIA DEL ENTRENAMIENTO' : 'TRAINING SCIENCE'}
        </p>
        <p style={{ fontSize: 12, color: T2, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
          {stress >= 7
            ? (isEs ? 'El estrés elevado aumenta el cortisol, afectando la recuperación muscular. Prioriza la técnica sobre la intensidad hoy.' : 'High stress elevates cortisol, affecting muscle recovery. Prioritize technique over intensity today.')
            : readiness >= 7
            ? (isEs ? 'Con alta readiness, tu SNC está preparado para adaptaciones máximas. Es el mejor momento para la sobrecarga progresiva.' : 'With high readiness, your CNS is primed for maximum adaptations. Ideal time for progressive overload.')
            : (isEs ? 'La consistencia supera a la intensidad. Un entrenamiento moderado hoy es mejor que ninguno.' : 'Consistency beats intensity. A moderate workout today is better than none.')
          }
        </p>
      </div>
    </div>
  )
}
