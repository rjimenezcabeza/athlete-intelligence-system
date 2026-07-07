'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { week: string; volume: number; sets: number }[]; locale: string }

export default function WeeklyVolumeBar({ data, locale }: Props) {
  const isEs = locale === 'es'
  if (!data || data.length === 0) return (
    <div className="rounded-2xl p-4 flex items-center justify-center h-32"
      style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-sm" style={{ color: '#555' }}>{isEs ? 'Sin datos aun' : 'No data yet'}</p>
    </div>
  )
  return (
    <div className="rounded-2xl p-4" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8888AA', fontFamily: 'Syne, sans-serif', fontSize: '10px' }}>
        {isEs ? 'Volumen semanal' : 'Weekly volume'}
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
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
  )
}
