import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main style={{
      minHeight: '100dvh', background: '#0A0A0F',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <style>{`
        @keyframes fadeDown { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); }  to { opacity:1; transform:translateY(0); } }
        .logo-anim { animation: fadeDown 0.45s ease-out both; }
        .form-anim { animation: fadeUp  0.45s ease-out 0.1s both; }
      `}</style>

      {/* ── Logo block ── */}
      <div className="logo-anim" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <div style={{
          width: 72, height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #C8FF00 0%, #88DD00 100%)',
          boxShadow: '0 0 48px rgba(200,255,0,0.35), 0 8px 28px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#0A0A0F', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em' }}>
            AIS
          </span>
        </div>
        <p style={{
          fontSize: 10, fontWeight: 700, color: '#44445a',
          fontFamily: 'Syne, sans-serif', letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          Athlete Intelligence System
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="form-anim" style={{ width: '100%', maxWidth: 360 }}>
        <div style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 22,
          padding: '28px 24px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.55)',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: '#F0F0F5', marginBottom: 24 }}>
            Iniciar sesión
          </h2>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
