'use client'

interface WeeklyVolumeBarProps {
  data: { week: string; volume: number; sets: number }[]
  locale: string
}

export default function WeeklyVolumeBar({ data, locale }: WeeklyVolumeBarProps) {
  const isEs = locale === 'es'
  if (!data || data.length === 0) {
    return (
      <div
        className="rounded-2xl p-4 flex items-center justify-center h-32"
        style={{ background: '#111118', border: '1px solid #1a1a2e' }}
      >
        <p className="text-sm" style={{ color: '#555' }}>
          {isEs ? 'Sin datos aun' : 'No data yet'}
        </p>
      </div>
    )
  }

  const maxVol = Math.max(...data.map(d => d.volume), 1)

  return (
    <div className="rounded-2xl p-4" style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#555' }}>
        {isEs ? 'Volumen semanal (kg)' : 'Weekly volume (kg)'}
      </p>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full relative flex items-end" style={{ height: '72px' }}>
              <div
                className="w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${Math.max((d.volume / maxVol) * 100, 4)}%`,
                  background: i === data.length - 1 ? '#C8FF00' : '#1a2a00'
                }}
              />
            </div>
            <span className="text-xs" style={{ color: '#555', fontSize: '9px' }}>{d.week}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
