interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{
        background: accent ? '#C8FF00' : '#111118',
        border: accent ? 'none' : '1px solid #1a1a2e'
      }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: accent ? '#0A0A0F99' : '#555' }}>
        {label}
      </p>
      <p
        className="text-3xl font-bold leading-none"
        style={{ color: accent ? '#0A0A0F' : '#fff', fontFamily: 'DM Mono, monospace' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: accent ? '#0A0A0F77' : '#666' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
