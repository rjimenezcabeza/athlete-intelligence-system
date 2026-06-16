'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'

export function LoginForm() {
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null as string | null)
  const isEs = locale === 'es'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })
      if (res.ok) {
        // Recarga completa para que el layout lea las cookies de sesion
        window.location.href = '/' + locale + '/dashboard'
        return
      }
      const json = await res.json()
      setError(json.error ?? (isEs ? 'Credenciales incorrectas' : 'Invalid credentials'))
      setLoading(false)
    } catch {
      setError(isEs ? 'Error de red. Intentalo de nuevo.' : 'Network error. Please try again.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#111118', border: '1px solid #333',
    borderRadius: '12px', padding: '12px 16px', color: '#fff',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', color: '#888', marginBottom: '6px' }

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={lbl}>Email</label>
        <input type='email' value={email} onChange={e => setEmail(e.target.value)}
          placeholder='atleta@ejemplo.com' required autoComplete='email' style={inp} />
      </div>
      <div>
        <label style={lbl}>{isEs ? 'Contrasena' : 'Password'}</label>
        <input type='password' value={password} onChange={e => setPassword(e.target.value)}
          required autoComplete='current-password' style={inp} />
      </div>
      {error && <p style={{ color: '#FF6B6B', fontSize: '13px' }}>{error}</p>}
      <button type='submit' disabled={loading} style={{
        background: '#C8FF00', color: '#0A0A0F', border: 'none',
        borderRadius: '12px', padding: '14px', fontSize: '15px',
        fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1, width: '100%',
      }}>
        {loading ? (isEs ? 'Iniciando...' : 'Logging in...') : (isEs ? 'Iniciar sesion' : 'Log in')}
      </button>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
        {isEs ? 'No tienes cuenta? ' : "Don't have an account? "}
        <a href={'/' + locale + '/register'} style={{ color: '#C8FF00', textDecoration: 'none' }}>
          {isEs ? 'Registrarse' : 'Sign up'}
        </a>
      </p>
    </form>
  )
}