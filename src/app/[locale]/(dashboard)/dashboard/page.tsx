'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import PatternCard from '@/components/dashboard/PatternCard'
import RecentSessionsList from '@/components/dashboard/RecentSessionsList'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter()
  const [locale, setLocale] = useState<string>('es')

  useEffect(() => {
    params.then(p => setLocale(p.locale ?? 'es'))
  }, [params])

  const isEs = locale === 'es'
  const { data, loading, error } = useDashboardSummary()

  if (loading) return (
    <div className="min-h-screen pb-24 px-4 pt-8" style={{ background: '#0A0A0F' }}>
      <style>{'.skeleton { background: linear-gradient(90deg, #16161f 25%, #1e1e2e 50%, #16161f 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; } @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }'}</style>
      {/* Header skeleton */}
      <div className="h-4 w-32 rounded-full skeleton mb-2" />
      <div className="h-8 w-48 rounded-xl skeleton mb-6" />
      {/* Hero skeleton */}
      <div className="h-36 w-full rounded-2xl skeleton mb-4" />
      {/* Cards grid skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl skeleton" />)}
      </div>
      {/* Button skeleton */}
      <div className="h-14 w-full rounded-2xl skeleton mb-4" />
      {/* Chart skeleton */}
      <div className="h-40 w-full rounded-2xl skeleton" />
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
      <div className="text-center">
        <p className="text-sm mb-4" style={{ color: '#FF6B6B' }}>{error ?? 'Error cargando datos'}</p>
        <button onClick={() => router.push(`/${locale}/login`)} className="text-sm px-4 py-2 rounded-xl"
          style={{ background: '#C8FF00', color: '#0A0A0F' }}>
          {isEs ? 'Iniciar sesion' : 'Log in'}
        </button>
      </div>
    </div>
  )

  const { profile, stats, weeklyChart, patterns, progressions, recommendations, recentSessions } = data

  return (
    <div className="min-h-screen pb-28" style={{ background: '#0A0A0F' }}>
      {/* Animated skeleton style if needed */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-0 { animation: fadeInUp 0.4s ease-out 0ms both; }
        .fade-in-1 { animation: fadeInUp 0.4s ease-out 100ms both; }
        .fade-in-2 { animation: fadeInUp 0.4s ease-out 200ms both; }
        .fade-in-3 { animation: fadeInUp 0.4s ease-out 300ms both; }
        .fade-in-4 { animation: fadeInUp 0.4s ease-out 400ms both; }
      `}</style>

      {/* HEADER */}
      <div className="px-5 pt-10 pb-6 fade-in-0">
        <p className="text-xs font-medium tracking-widest uppercase mb-1.5" style={{ color: '#555', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Bienvenido de vuelta' : 'Welcome back'}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: '#F0F0F5', fontFamily: 'Syne, sans-serif' }}>
            {profile.display_name}
          </h1>
          {profile.subscription_tier === 'pro' && (
            <span className="text-xs px-3 py-1 rounded-full font-bold tracking-wider"
              style={{ background: 'linear-gradient(135deg, #C8FF00 0%, #88DD00 100%)', color: '#0A0A0F' }}>
              PRO
            </span>
          )}
        </div>
      </div>

      {/* HERO METRIC — Streak */}
      <div className="mx-4 mb-4 rounded-2xl p-6 fade-in-1 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #111820 0%, #0d150a 100%)', border: '1px solid rgba(200,255,0,0.15)', boxShadow: '0 0 40px rgba(200,255,0,0.08)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C8FF0099', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Racha activa' : 'Active streak'}
        </p>
        <div className="flex items-end gap-2">
          <span style={{ fontSize: '80px', lineHeight: 1, fontWeight: 700, color: '#C8FF00', fontFamily: 'DM Mono, monospace', letterSpacing: '-0.02em' }}>
            {stats.streak}
          </span>
          <span className="text-xl pb-3 font-medium" style={{ color: '#8888AA' }}>
            {isEs ? (stats.streak === 1 ? 'día' : 'días') : (stats.streak === 1 ? 'day' : 'days')}
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: '#8888AA' }}>
          {stats.totalSessions} {isEs ? 'sesiones completadas' : 'sessions completed'}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3 fade-in-1">
          {[
            { label: isEs ? 'Duración media' : 'Avg duration', value: stats.avgDuration > 0 ? `${stats.avgDuration}m` : '-', sub: isEs ? 'por sesión' : 'per session' },
            { label: 'Plan', value: profile.subscription_tier === 'pro' ? 'Pro' : 'Free', sub: profile.subscription_tier === 'free' ? (isEs ? 'Actualiza' : 'Upgrade') : (isEs ? 'Activo' : 'Active'), accent: profile.subscription_tier === 'pro' },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#8888AA', fontFamily: 'Syne, sans-serif', fontSize: '10px' }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.accent ? '#C8FF00' : '#F0F0F5', fontFamily: 'DM Mono, monospace' }}>{card.value}</p>
              {card.sub && <p className="text-xs mt-1" style={{ color: '#555' }}>{card.sub}</p>}
            </div>
          ))}
        </div>

        {/* CTA BUTTON */}
        <Link href={`/${locale}/session/new`}
          className="block w-full py-4 rounded-2xl text-center font-bold text-lg active:scale-98 transition-transform fade-in-2"
          style={{ background: 'linear-gradient(135deg, #C8FF00 0%, #88DD00 100%)', color: '#0A0A0F', fontFamily: 'Syne, sans-serif', boxShadow: '0 0 32px rgba(200,255,0,0.25)' }}>
          {isEs ? '⚡ Entrenar ahora' : '⚡ Train now'}
        </Link>

        {/* VOLUME CHART */}
        {weeklyChart.length > 0 && (
          <div className="rounded-2xl p-4 fade-in-2" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8888AA', fontFamily: 'Syne, sans-serif', fontSize: '10px' }}>
              {isEs ? 'Volumen semanal' : 'Weekly volume'}
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={weeklyChart} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8FF00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C8FF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#16161f', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '8px', color: '#F0F0F5', fontSize: '12px' }}
                  formatter={(v: any) => [`${v}kg`, isEs ? 'Volumen' : 'Volume']} />
                <Area type="monotone" dataKey="volume" stroke="#C8FF00" strokeWidth={2} fill="url(#volGrad)" dot={false} activeDot={{ r: 4, fill: '#C8FF00' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI COACH */}
        {recommendations.length > 0 && (
          <div className="fade-in-3">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#8888AA', fontFamily: 'Syne, sans-serif', fontSize: '10px' }}>AI Coach</p>
            <div className="space-y-2">
              {recommendations.map(r => (
                <div key={r.id} className="rounded-2xl p-4" style={{ background: '#0d150a', border: '1px solid rgba(200,255,0,0.12)' }}>
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: '20px' }}>
                      {r.recommendation_type === 'recovery_warning' ? '⚠️' : r.recommendation_type === 'progression_opportunity' ? '📈' : r.recommendation_type === 'volume_adjustment' ? '💪' : '🤖'}
                    </span>
                    <p className="text-sm flex-1" style={{ color: '#ddd', lineHeight: 1.5 }}>{r.recommendation_text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PATTERNS */}
        {patterns.length > 0 && (
          <div className="fade-in-3">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#8888AA', fontFamily: 'Syne, sans-serif', fontSize: '10px' }}>
              {isEs ? 'Patrones detectados' : 'Detected patterns'}
            </p>
            <div className="space-y-2">
              {patterns.map(p => (
                <PatternCard key={p.id} title={isEs ? p.title_es : p.title_en}
                  description={isEs ? p.description_es : p.description_en} severity={p.severity} />
              ))}
            </div>
          </div>
        )}

        {/* RECENT PROGRESSIONS */}
        {progressions.length > 0 && (
          <div className="fade-in-4">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#8888AA', fontFamily: 'Syne, sans-serif', fontSize: '10px' }}>
              {isEs ? 'Progresiones recientes' : 'Recent progressions'}
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)', background: '#111118' }}>
              {progressions.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#ddd' }}>{p.exercises?.name ?? 'Ejercicio'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>{isEs ? p.reasoning_es : p.reasoning_en}</p>
                  </div>
                  {p.new_weight_kg && (
                    <span className="text-sm font-bold" style={{ color: '#C8FF00', fontFamily: 'DM Mono, monospace' }}>{p.new_weight_kg}kg</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT SESSIONS */}
        <RecentSessionsList sessions={recentSessions} locale={locale} />
      </div>
    </div>
  )
}
