'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface FeedbackDataPoint {
  date: string
  pump: number | null
  fatigue: number | null
  recovery: number | null
}

interface FeedbackTrendChartProps {
  data: FeedbackDataPoint[]
  language?: string
}

export function FeedbackTrendChart({ data, language = 'es' }: FeedbackTrendChartProps) {
  const labels = {
    pump: 'Pump',
    fatigue: language === 'en' ? 'Fatigue' : 'Fatiga',
    recovery: language === 'en' ? 'Recovery' : 'Recuperación',
    title: language === 'en' ? 'Session Feedback Trend' : 'Tendencia de Feedback',
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-white/20 text-sm">
        {language === 'en' ? 'No feedback data yet' : 'Sin datos de feedback aún'}
      </div>
    )
  }

  return (
    <div>
      <p className="text-white/40 text-xs mb-3 font-mono uppercase tracking-wide">{labels.title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="pumpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C8FF00" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#C8FF00" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, 5]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px'
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <Area type="monotone" dataKey="pump" stroke="#C8FF00" fill="url(#pumpGrad)" strokeWidth={1.5} name={labels.pump} />
          <Area type="monotone" dataKey="fatigue" stroke="#ef4444" fill="url(#fatigueGrad)" strokeWidth={1.5} name={labels.fatigue} />
          <Area type="monotone" dataKey="recovery" stroke="#60a5fa" fill="url(#recoveryGrad)" strokeWidth={1.5} name={labels.recovery} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
