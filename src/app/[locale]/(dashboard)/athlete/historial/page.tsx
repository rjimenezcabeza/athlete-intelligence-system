'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AthleteTabBar } from '@/components/athlete/AthleteTabBar'

const BG=`var(--bg-primary,#0A0A0F)`,CARD=`var(--card-bg,rgba(255,255,255,.04))`,BDR=`var(--card-border,rgba(255,255,255,.08))`,T1=`var(--text-primary,#fff)`,T2=`var(--text-secondary,#888)`,T3=`var(--text-tertiary,#44445a)`,ACC=`var(--accent-color,#C8FF00)`

function Skel({ h, w = '100%' }: { h: number; w?: string }) {
  return (
    <div style={{
      height: h, width: w,
      background: 'linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 10,
    }} />
  )
}

export default function HistorialPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const isEs = locale !== 'en'
  const [sessions, setSessions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from dashboard summary for quick access
    fetch('/api/dashboard/summary')
      .then(r => r.json())
      .then(d => {
        setSessions(d?.recentSessions?.filter((s: any) => s.status !== 'daily_log') ?? [])
        setStats(d?.stats ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: isEs ? 'Total' : 'Total', value: stats.totalSessions ?? 0 },
    { label: isEs ? 'Racha' : 'Streak', value: `${stats.streak ?? 0}d` },
    { label: isEs ? 'Media' : 'Avg', value: stats.avgDuration ? `${stats.avgDuration}m` : '—' },
  ] : []

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 100 }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>

      <div style={{ paddingTop: 52 }}>
        <AthleteTabBar locale={locale} />
      </div>

      <div style={{ padding: '16px 20px 12px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: 'Syne,sans-serif', color: T1, letterSpacing: '-0.02em' }}>
          📅 {isEs ? 'Historial' : 'History'}
        </h1>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* KPI strip */}
        {!loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {kpis.map(k => (
              <div key={k.label} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, padding: '10px 0', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T1, fontFamily: 'DM Mono,monospace' }}>{k.value}</p>
                <p style={{ margin: '3px 0 0', fontSize: 9, color: T3, fontFamily: 'Syne,sans-serif', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{k.label}</p>
              </div>
            ))}
          </div>
        )}
        {loading && <Skel h={60} />}

        {/* Recent sessions preview */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T3, fontFamily: 'Syne,sans-serif', letterSpacing: '.10em', textTransform: 'uppercase' }}>
            {isEs ? 'Sesiones recientes' : 'Recent sessions'}
          </p>
          <Link href={`/${locale}/history`} style={{ fontSize: 11, color: ACC, fontFamily: 'Syne,sans-serif', fontWeight: 700, textDecoration: 'none' }}>
            {isEs ? 'Ver todo →' : 'View all →'}
          </Link>
        </div>

        {loading && [1, 2, 3].map(i => <Skel key={i} h={64} />)}

        {!loading && sessions.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: CARD, border: `1px solid ${BDR}`, borderRadius: 16 }}>
            <p style={{ fontSize: 36, margin: '0 0 10px' }}>🏋️</p>
            <p style={{ fontSize: 14, color: T1, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>
              {isEs ? 'Sin sesiones todavía' : 'No sessions yet'}
            </p>
            <Link href={`/${locale}/session/new`} style={{
              display: 'inline-block', marginTop: 16,
              padding: '10px 24px', background: ACC,
              color: '#0A0A0F', borderRadius: 10,
              fontSize: 13, fontWeight: 700, fontFamily: 'Syne,sans-serif', textDecoration: 'none',
            }}>
              + {isEs ? 'Empezar' : 'Start'}
            </Link>
          </div>
        )}

        {!loading && sessions.slice(0, 5).map((s: any, i: number) => {
          const date = new Date(s.session_date + 'T12:00:00')
          const label = date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })
          return (
            <Link key={s.id} href={`/${locale}/history`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: CARD, border: `1px solid ${BDR}`, borderRadius: 14,
                padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                animation: `fadeUp .4s ease-out ${i * 50 + 100}ms both`,
              }}>
                <div>
                  <p style={{ color: T1, fontSize: 14, fontWeight: 600, fontFamily: 'Syne,sans-serif', textTransform: 'capitalize', marginBottom: 2 }}>{label}</p>
                  <p style={{ color: T3, fontSize: 11, fontFamily: 'DM Mono,monospace' }}>{s.duration_minutes ? `${s.duration_minutes}min` : '—'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {s.pump_rating != null && <span style={{ color: ACC, fontSize: 12, fontFamily: 'DM Mono,monospace' }}>{s.pump_rating}</span>}
                  {s.local_fatigue != null && <span style={{ color: '#FF6B6B', fontSize: 12, fontFamily: 'DM Mono,monospace' }}>{s.local_fatigue}</span>}
                  <span style={{ color: T3, fontSize: 16 }}>›</span>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Go to full history */}
        <Link href={`/${locale}/history`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px', background: CARD, border: `1px solid ${BDR}`,
          borderRadius: 14, color: T2, fontSize: 13, fontFamily: 'Syne,sans-serif',
          fontWeight: 700, textDecoration: 'none', gap: 8,
        }}>
          📋 {isEs ? 'Historial completo' : 'Full history'}
        </Link>
      </div>
    </div>
  )
}
