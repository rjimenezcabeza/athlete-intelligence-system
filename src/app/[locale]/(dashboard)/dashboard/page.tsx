'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const BG = '#0A0A0F', CARD = '#111118', ACC = '#C8FF00', T1 = '#F0F0F5', T2 = '#8888AA', T3 = '#44445a', BORDER = 'rgba(255,255,255,0.06)'

function Skel({ w = '100%', h = 32 }: { w?: string | number; h?: number }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 10, flexShrink: 0 }} />
}

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(r => { if (r.status === 401) { router.push('/' + locale + '/login'); return null } return r.json() })
      .then(d => { if (d) { setData(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [])

  const kpis = [
    { label: isEs ? 'RACHA' : 'STREAK', value: data?.stats?.streak ?? 0, unit: 'd', sub: isEs ? 'dias seguidos' : 'consecutive', accent: (data?.stats?.streak ?? 0) >= 3 },
    { label: isEs ? 'SESIONES' : 'SESSIONS', value: data?.stats?.totalSessions ?? 0, unit: '', sub: isEs ? 'completadas' : 'completed', accent: false },
    { label: isEs ? 'MEDIA' : 'AVG', value: data?.stats?.avgDuration ?? null, unit: 'min', sub: isEs ? 'por sesion' : 'per session', accent: false },
    { label: 'PLAN', value: data?.profile?.subscription_tier === 'pro' ? 'Pro' : 'Free', unit: '', sub: '', accent: data?.profile?.subscription_tier === 'pro' },
  ]

  const fb = data?.stats?.avgFeedback
  const feedbackBars = fb ? [
    { label: 'Pump', value: fb.pump, color: ACC },
    { label: isEs ? 'Fatiga' : 'Fatigue', value: fb.fatigue, color: '#FF6B6B' },
    { label: isEs ? 'Recuper.' : 'Recovery', value: fb.recovery, color: '#4ECDC4' },
    { label: 'RIR', value: fb.rir, color: '#A78BFA' },
  ] : null

  return (
    <div style={{ minHeight: '100vh', background: BG, paddingBottom: 96 }}>

      {/* Header */}
      <div className="fade-in" style={{ padding: '28px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T3, marginBottom: 6 }}>
            {isEs ? 'BIENVENIDO DE VUELTA' : 'WELCOME BACK'}
          </p>
          {loading ? <Skel w={160} h={32} /> : (
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, color: T1, lineHeight: 1.1 }}>
              {data?.profile?.display_name ?? 'Atleta'}
            </h1>
          )}
        </div>
        {!loading && data?.profile?.subscription_tier === 'pro' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif', background: 'rgba(200,255,0,0.15)', color: ACC, border: '1px solid rgba(200,255,0,0.3)' }}>PRO</span>
        )}
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {kpis.map((k, i) => (
            <div key={i} className={'fade-in s' + i} style={{
              background: k.accent ? 'linear-gradient(135deg,rgba(200,255,0,0.1) 0%,rgba(200,255,0,0.04) 100%)' : CARD,
              border: '1px solid ' + (k.accent ? 'rgba(200,255,0,0.2)' : BORDER),
              borderRadius: 18, padding: '18px 16px'
            }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T3, marginBottom: 10 }}>{k.label}</p>
              {loading ? <Skel h={36} /> : (
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 34, fontWeight: 700, lineHeight: 1, color: k.accent ? ACC : T1 }}>
                  {k.value === null ? '—' : k.value}
                  {k.unit && k.value !== null && <span style={{ fontSize: 16, color: T2, marginLeft: 4 }}>{k.unit}</span>}
                </p>
              )}
              {k.sub && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: T3, marginTop: 4 }}>{k.sub}</p>}
            </div>
          ))}
        </div>

        {/* CTA Entrenar */}
        <Link href={'/' + locale + '/session/new'} className="fade-in s2" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'linear-gradient(135deg,#C8FF00 0%,#88DD00 100%)',
          color: BG, borderRadius: 18, padding: '20px',
          fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800,
          letterSpacing: '0.03em', boxShadow: '0 4px 24px rgba(200,255,0,0.3)'
        }}>
          <span style={{ fontSize: 22 }}>+</span>
          {isEs ? 'Entrenar ahora' : 'Train now'}
        </Link>

        {/* Recharts AreaChart — Volumen Semanal */}
        {!loading && data?.weeklyChart?.length > 1 && (
          <div className="fade-in s3" style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '18px 16px' }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T3, marginBottom: 14 }}>
              {isEs ? 'VOLUMEN SEMANAL (kg)' : 'WEEKLY VOLUME (kg)'}
            </p>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={data.weeklyChart} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACC} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={ACC} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: T3, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#16161f', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 10, color: T1, fontSize: 12 }}
                  formatter={(v: unknown) => [`${v} kg`, isEs ? 'Volumen' : 'Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke={ACC} strokeWidth={2} fill="url(#volGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Empty state chart */}
        {!loading && (!data?.weeklyChart || data.weeklyChart.length === 0) && (
          <div className="fade-in s3" style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>📊</p>
            <p style={{ fontSize: 13, color: T3 }}>{isEs ? 'Completa sesiones para ver el gráfico de volumen' : 'Complete sessions to see the volume chart'}</p>
          </div>
        )}

        {/* Feedback Promedio */}
        {!loading && feedbackBars && (
          <div className="fade-in s3" style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '18px 16px' }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T3, marginBottom: 14 }}>
              {isEs ? 'FEEDBACK PROMEDIO (4 sesiones)' : 'AVG FEEDBACK (4 sessions)'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feedbackBars.map(fb => (
                <div key={fb.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T3 }}>{fb.label}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: fb.color }}>{fb.value.toFixed(1)}/5</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: '#1a1a2e', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: fb.color, width: (fb.value / 5 * 100) + '%', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Coach Preview */}
        {!loading && data?.recommendations?.length > 0 && (
          <div className="fade-in s3" style={{ background: CARD, border: '1px solid rgba(200,255,0,0.08)', borderRadius: 18, padding: '18px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T3 }}>
                {isEs ? 'AI COACH' : 'AI COACH'}
              </p>
              <Link href={'/' + locale + '/coach'} style={{ fontSize: 11, color: ACC, fontFamily: 'Syne, sans-serif' }}>
                {isEs ? 'Ver todo →' : 'See all →'}
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recommendations.slice(0, 2).map((r: any) => (
                <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACC, flexShrink: 0, marginTop: 5, animation: 'pulseAcc 2.5s ease-in-out infinite' }} />
                  <p style={{ fontSize: 12, color: T2, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{r.recommendation_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sesiones recientes */}
        {!loading && data?.recentSessions?.length > 0 && (
          <div className="fade-in s3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T3 }}>
                {isEs ? 'RECIENTES' : 'RECENT'}
              </p>
              <Link href={'/' + locale + '/history'} style={{ color: ACC, fontSize: 12, fontFamily: 'Syne, sans-serif' }}>
                {isEs ? 'Ver todo →' : 'See all →'}
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.recentSessions.filter((s: any) => s.status !== 'daily_log').slice(0, 3).map((s: any) => {
                const date = new Date(s.session_date)
                const label = date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })
                return (
                  <Link key={s.id} href={'/' + locale + '/history'} style={{
                    background: CARD, border: '1px solid ' + BORDER, borderRadius: 14,
                    padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ color: T1, fontSize: 14, fontWeight: 500, fontFamily: 'Syne, sans-serif', textTransform: 'capitalize', marginBottom: 2 }}>{label}</p>
                      <p style={{ color: T3, fontSize: 11 }}>{s.duration_minutes ? s.duration_minutes + 'min' : '—'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {s.pump_rating != null && <span style={{ color: ACC, fontSize: 13, fontFamily: 'DM Mono, monospace' }}>{s.pump_rating}</span>}
                      {s.local_fatigue != null && <span style={{ color: '#FF6B6B', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>{s.local_fatigue}</span>}
                      <span style={{ color: T3, fontSize: 18 }}>›</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && (!data?.recentSessions || data.recentSessions.filter((s: any) => s.status !== 'daily_log').length === 0) && (
          <div className="fade-in s3" style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>🏋️</p>
            <p style={{ color: T1, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
              {isEs ? 'Sin entrenamientos todavía' : 'No workouts yet'}
            </p>
            <p style={{ color: T3, fontSize: 13, marginBottom: 24 }}>
              {isEs ? 'Registra tu primer entrenamiento para ver tus estadísticas' : 'Log your first workout to see your stats'}
            </p>
            <Link href={'/' + locale + '/session/new'} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(200,255,0,0.1)', color: ACC,
              border: '1px solid rgba(200,255,0,0.2)', borderRadius: 12,
              padding: '12px 28px', fontFamily: 'Syne, sans-serif',
              fontSize: 14, fontWeight: 700
            }}>
              + {isEs ? 'Empezar' : 'Start'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
