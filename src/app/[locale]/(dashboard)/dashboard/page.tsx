'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import StatCard from '@/components/dashboard/StatCard'
import PatternCard from '@/components/dashboard/PatternCard'
import WeeklyVolumeBar from '@/components/dashboard/WeeklyVolumeBar'
import FeedbackRadar from '@/components/dashboard/FeedbackRadar'
import RecentSessionsList from '@/components/dashboard/RecentSessionsList'

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const { data, loading, error } = useDashboardSummary()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C8FF00', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: '#FF6B6B' }}>{error ?? 'Error'}</p>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="text-sm px-4 py-2 rounded-xl"
            style={{ background: '#C8FF00', color: '#0A0A0F' }}
          >
            {isEs ? 'Iniciar sesion' : 'Log in'}
          </button>
        </div>
      </div>
    )
  }

  const { profile, stats, weeklyChart, patterns, progressions, recommendations, recentSessions } = data

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0A0A0F' }}>
      <div className="px-4 pt-8 pb-6">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#555' }}>
          {isEs ? 'Bienvenido de vuelta' : 'Welcome back'}
        </p>
        <h1 className="text-2xl font-bold" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {profile.display_name}
        </h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label={isEs ? 'Racha' : 'Streak'} value={`${stats.streak}d`} sub={isEs ? 'dias consecutivos' : 'consecutive days'} accent={stats.streak >= 3} />
          <StatCard label={isEs ? 'Sesiones' : 'Sessions'} value={stats.totalSessions} sub={isEs ? 'completadas' : 'completed'} />
          <StatCard label={isEs ? 'Duracion media' : 'Avg duration'} value={stats.avgDuration > 0 ? `${stats.avgDuration}m` : '-'} sub={isEs ? 'por sesion' : 'per session'} />
          <StatCard label="Plan" value={profile.subscription_tier === 'free' ? 'Free' : 'Pro'} sub={profile.subscription_tier === 'free' ? (isEs ? 'Actualiza a Pro' : 'Upgrade to Pro') : undefined} />
        </div>

        <Link
          href={`/${locale}/session/new`}
          className="block w-full py-4 rounded-2xl text-center font-bold text-lg transition-all duration-150 active:scale-95"
          style={{ background: '#C8FF00', color: '#0A0A0F', fontFamily: 'Syne, sans-serif' }}
        >
          {isEs ? 'Entrenar ahora' : 'Train now'}
        </Link>

        <WeeklyVolumeBar data={weeklyChart} locale={locale} />

        {stats.avgFeedback && (
          <FeedbackRadar
            pump={stats.avgFeedback.pump}
            fatigue={stats.avgFeedback.fatigue}
            recovery={stats.avgFeedback.recovery}
            rir={stats.avgFeedback.rir}
            locale={locale}
          />
        )}

        {patterns.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#555' }}>
              {isEs ? 'Patrones detectados' : 'Detected patterns'}
            </p>
            <div className="space-y-2">
              {patterns.map((p) => (
                <PatternCard key={p.id} title={isEs ? p.title_es : p.title_en} description={isEs ? p.description_es : p.description_en} severity={p.severity} />
              ))}
            </div>
          </div>
        )}

        {progressions.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#555' }}>
              {isEs ? 'Progresiones recientes' : 'Recent progressions'}
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1a1a2e' }}>
              {progressions.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3" style={{ background: '#111118', borderTop: i > 0 ? '1px solid #1a1a2e' : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#ddd' }}>{p.exercises?.name ?? 'Ejercicio'}</p>
                    <p className="text-xs" style={{ color: '#666' }}>{isEs ? p.reasoning_es : p.reasoning_en}</p>
                  </div>
                  {p.new_weight_kg && (
                    <span className="text-sm font-bold" style={{ color: '#C8FF00', fontFamily: 'DM Mono, monospace' }}>{p.new_weight_kg}kg</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#555' }}>AI Coach</p>
            <div className="space-y-2">
              {recommendations.map((r) => (
                <div key={r.id} className="rounded-xl p-4" style={{ background: '#0d1a0d', border: '1px solid #C8FF0022' }}>
                  <p className="text-sm" style={{ color: '#ccc' }}>{r.recommendation_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <RecentSessionsList sessions={recentSessions} locale={locale} />
      </div>
    </div>
  )
}
