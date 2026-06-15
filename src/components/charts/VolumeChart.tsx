'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface VolumeDataPoint {
  date: string
  volume: number
  sessions: number
}

interface VolumeChartProps {
  data: VolumeDataPoint[]
  language?: string
}

const CustomTooltip = ({ active, payload, label, language }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-xs">
        <p className="text-white/50 mb-1">{label}</p>
        <p className="text-[#C8FF00] font-bold">
          {payload[0]?.value?.toLocaleString()}kg
        </p>
        {payload[1] && (
          <p className="text-white/40">
            {payload[1].value} {language === 'en' ? 'sessions' : 'sesiones'}
          </p>
        )}
      </div>
    )
  }
  return null
}

export function VolumeChart({ data, language = 'es' }: VolumeChartProps) {
  const label = language === 'en' ? 'Weekly Volume (kg)' : 'Volumen Semanal (kg)'

  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-white/20 text-sm">
        {language === 'en' ? 'No data yet' : 'Sin datos aún'}
      </div>
    )
  }

  return (
    <div>
      <p className="text-white/40 text-xs mb-3 font-mono uppercase tracking-wide">{label}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip language={language} />} />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="#C8FF00"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#C8FF00' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
