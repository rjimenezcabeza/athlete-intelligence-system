'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ background: '#0A0A0F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, fontFamily: 'monospace' }}>
        <div style={{ textAlign: 'center', gap: '16px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: '#C8FF00', fontSize: '14px', letterSpacing: '0.1em' }}>ERROR</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{error.message}</p>
          <button
            onClick={reset}
            style={{ background: '#C8FF00', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
