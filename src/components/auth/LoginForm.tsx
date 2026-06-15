'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const locale = useLocale()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEs = locale === 'es'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/${locale}/dashboard`)
    router.refresh()
  }

  const inputStyle = {
    width: '100%', background: '#111118', border: '1px solid #333',
    borderRadius: '12px', padding: '12px 16px', color: '#fff',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = { display: 'block', fontSize: '13px', color: '#888', marginBottom: '6px' }

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="atleta@ejemplo.com" required autoComplete="email" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>{isEs ? 'Contrasena' : 'Password'}</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          required autoComplete="current-password" style={inputStyle} />
      </div>
      {error && <p style={{ color: '#FF6B6B', fontSize: '13px' }}>{error}</p>}
      <button type="submit" disabled={loading}
        style={{
          background: '#C8FF00', color: '#0A0A0F', border: 'none',
          borderRadius: '12px', padding: '14px', fontSize: '15px',
          fontWeight: '700', fontFamily: 'Syne, sans-serif',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          width: '100%',
        }}>
        {loading ? (isEs ? 'Iniciando...' : 'Logging in...') : (isEs ? 'Iniciar sesion' : 'Log in')}
      </button>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
        {isEs ? 'No tienes cuenta? ' : "Don't have an account? "}
        <a href={`/${locale}/register`} style={{ color: '#C8FF00', textDecoration: 'none' }}>
          {isEs ? 'Registrarse' : 'Sign up'}
        </a>
      </p>
    </form>
  )
}
