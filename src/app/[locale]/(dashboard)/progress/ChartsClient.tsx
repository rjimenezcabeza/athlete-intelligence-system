'use client'

import { FeedbackTrendChart } from '@/components/charts/FeedbackTrendChart'

interface ChartsClientProps {
  language: string
  feedbackData: any[]
  statsData: { total_sessions: number; avg_duration: number; avg_pump: string | null }
  locale: string
}

export default function ChartsClient({ language, feedbackData, statsData, locale }: ChartsClientProps) {
  const t = {
    title: language === 'en' ? 'Progress' : 'Progreso',
    subtitle: language === 'en' ? 'Last 8 weeks' : 'Últimas 8 semanas',
    sessions: language === 'en' ? 'Sessions' : 'Sesiones',
    avg_duration: language === 'en' ? 'Avg Duration' : 'Duración Media',
    avg_pump: language === 'en' ? 'Avg Pump' : 'Pump Medio',
    minutes: 'min',
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          {t.title}
        </h1>
        <p className="text-white/40 text-sm">{t.subtitle}</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t.sessions, value: statsData.total_sessions, unit: '' },
            { label: t.avg_duration, value: statsData.avg_duration || '—', unit: statsData.avg_duration ? t.minutes : '' },
            { label: t.avg_pump, value: statsData.avg_pump || '—', unit: statsData.avg_pump ? '/5' : '' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-[#C8FF00] font-bold text-xl font-mono">
                {stat.value}{stat.unit}
              </p>
              <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Feedback Trend */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <FeedbackTrendChart data={feedbackData} language={language} />
        </div>

        {/* Placeholder VolumeChart */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
          <p className="text-white/20 text-xs font-mono">
            {language === 'en' ? 'Volume chart — coming with more data' : 'Chart de volumen — disponible con más datos'}
          </p>
        </div>
      </div>
    </div>
  )
}
