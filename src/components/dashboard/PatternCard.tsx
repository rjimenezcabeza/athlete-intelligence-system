'use client'
const SEV: Record<string, { color: string; bg: string; icon: string }> = {
  info:    { color: '#60A5FA', bg: '#1a2a3a', icon: 'i' },
  warning: { color: '#FBBF24', bg: '#2a2000', icon: '!' },
  success: { color: '#C8FF00', bg: '#1a2a00', icon: 'v' },
  danger:  { color: '#FF6B6B', bg: '#2a1010', icon: '!' },
}
interface PatternCardProps { title: string; description: string; severity: string; onDismiss?: () => void }
export default function PatternCard({ title, description, severity, onDismiss }: PatternCardProps) {
  const cfg = SEV[severity] ?? SEV.info
  return (
    <div className="rounded-xl p-4 flex gap-3" style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ background: cfg.color + '22', color: cfg.color }}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-0.5" style={{ color: '#fff' }}>{title}</p>
        <p className="text-xs" style={{ color: '#888' }}>{description}</p>
      </div>
      {onDismiss && <button onClick={onDismiss} className="text-xs flex-shrink-0 mt-0.5" style={{ color: '#555' }}>x</button>}
    </div>
  )
}
