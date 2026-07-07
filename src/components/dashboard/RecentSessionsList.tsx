'use client'
interface Session { id: string; session_date: string; duration_minutes: number | null; pump_rating: number | null; local_fatigue: number | null; perceived_recovery: number | null }
interface Props { sessions: Session[]; locale: string }
export default function RecentSessionsList({ sessions, locale }: Props) {
  const isEs = locale === 'es'
  if (!sessions || sessions.length === 0) return (
    <div className="rounded-2xl p-4" style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
      <p className="text-sm" style={{ color: '#555' }}>{isEs ? 'No hay sesiones todavia' : 'No sessions yet'}</p>
    </div>
  )
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1a1a2e' }}>
      <div className="px-4 py-3" style={{ background: '#0d0d14' }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: '#555' }}>{isEs ? 'Ultimas sesiones' : 'Recent sessions'}</p>
      </div>
      {sessions.map((s, i) => {
        const date = new Date(s.session_date)
        const label = date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })
        return (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3"
            style={{ background: '#111118', borderTop: i > 0 ? '1px solid #1a1a2e' : 'none' }}>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#ddd' }}>{label}</p>
              <p className="text-xs" style={{ color: '#555' }}>{s.duration_minutes ? `${s.duration_minutes}min` : '-'}</p>
            </div>
            <div className="flex gap-3 items-center text-xs" style={{ fontFamily: 'DM Mono, monospace' }}>
              {s.pump_rating != null && <span style={{ color: '#C8FF00' }}>{s.pump_rating}</span>}
              {s.local_fatigue != null && <span style={{ color: '#FF6B6B' }}>{s.local_fatigue}</span>}
              {s.perceived_recovery != null && <span style={{ color: '#4ECDC4' }}>{s.perceived_recovery}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
