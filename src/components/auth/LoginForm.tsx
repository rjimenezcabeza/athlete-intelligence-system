'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'

export function LoginForm() {
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailFocus, setEmailFocus] = useState(false)
  const [pwFocus, setPwFocus] = useState(false)
  const isEs = locale === 'es'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (res.ok) {
        window.location.href = '/' + locale + '/dashboard'
        return
      }
      const json = await res.json()
      setError(json.error ?? (isEs ? 'Credenciales incorrectas' : 'Invalid credentials'))
      setLoading(false)
    } catch {
      setError(isEs ? 'Error de red.' : 'Network error.')
      setLoading(false)
    }
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    background: '#0d0d14',
    border: '1.5px solid ' + (focused ? 'rgba(200,255,0,0.5)' : 'rgba(255,255,255,0.08)'),
    borderRadius: 14,
    color: '#F0F0F5',
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    padding: '14px 16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#44445a',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'Syne, sans-serif',
    marginBottom: 8,
  }

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="atleta@ejemplo.com"
          required
          autoComplete="email"
          style={inputStyle(emailFocus)}
          onFocus={() => setEmailFocus(true)}
          onBlur={() => setEmailFocus(false)}
        />
      </div>
      <div>
        <label style={labelStyle}>
          {isEs ? 'Contraseña' : 'Password'}
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={inputStyle(pwFocus)}
          onFocus={() => setPwFocus(true)}
          onBlur={() => setPwFocus(false)}
        />
      </div>
      {error && (
        <p style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#1a1a2e' : 'linear-gradient(135deg,#C8FF00,#88DD00)',
          color: loading ? '#8888AA' : '#0A0A0F',
          border: 'none',
          borderRadius: 14,
          padding: '16px',
          fontSize: 15,
          fontWeight: 800,
          fontFamily: 'Syne, sans-serif',
          letterSpacing: '0.04em',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(200,255,0,0.3)',
        }}
      >
        {loading ? (isEs ? 'Iniciando...' : 'Logging in...') : (isEs ? 'Iniciar sesión' : 'Log in')}
      </button>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#44445a', fontFamily: 'Inter, sans-serif' }}>
        {isEs ? 'Sin cuenta? ' : 'No account? '}
        <a href={'/' + locale + '/register'} style={{ color: '#C8FF00', fontWeight: 600, textDecoration: 'none' }}>
          {isEs ? 'Registrarse' : 'Sign up'}
        </a>
      </p>
    </form>
  )
}
