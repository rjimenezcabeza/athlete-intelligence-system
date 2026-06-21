'use client'
interface Props { pump: number; fatigue: number; recovery: number; rir: number; locale: string }
export default function FeedbackRadar({ pump, fatigue, recovery, rir, locale }: Props) {
  const isEs = locale === 'es'
  const metrics = [
    { label: 'Pump', value: pump, color: '#C8FF00' },
    { label: isEs ? 'Fatiga' : 'Fatigue', value: fatigue, color: '#FF6B6B' },
    { label: 'Rec.', value: recovery, color: '#4ECDC4' },
    { label: 'RIR', value: rir, color: '#A78BFA' },
  ]
  return (
    <div className="rounded-2xl p-4" style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#555' }}>
        {isEs ? 'Feedback promedio (4 sesiones)' : 'Avg feedback (4 sessions)'}
      </p>
      <div className="space-y-3">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs" style={{ color: '#888' }}>{m.label}</span>
              <span className="text-xs font-bold" style={{ color: m.color, fontFamily: 'DM Mono, monospace' }}>{m.value.toFixed(1)}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: '#1a1a2e' }}>
              <div className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${(m.value / 5) * 100}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
