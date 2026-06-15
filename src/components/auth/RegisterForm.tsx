'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export function RegisterForm() {
  const router = useRouter()
  const locale = useLocale()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEs = locale === 'es'

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('athlete_profiles').insert({
        user_id: data.user.id,
        display_name: displayName,
        weight_unit: 'kg',
        language: locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/[^\x00-\x7F]/g, ''),
        subscription_tier: 'free',
      })
    }
    router.push(`/${locale}/onboarding`)
    router.refresh()
  }

  const inputStyle = {
    width: '100%', background: '#111118', border: '1px solid #333',
    borderRadius: '12px', padding: '12px 16px', color: '#fff',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = { display: 'block', fontSize: '13px', color: '#888', marginBottom: '6px' }

  return (
    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>{isEs ? 'Nombre' : 'Name'}</label>
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
          placeholder={isEs ? 'Tu nombre' : 'Your name'} required style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="atleta@ejemplo.com" required autoComplete="email" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>{isEs ? 'Contrasena' : 'Password'}</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          required minLength={8} autoComplete="new-password" style={inputStyle} />
        <p style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
          {isEs ? 'Minimo 8 caracteres' : 'Minimum 8 characters'}
        </p>
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
        {loading ? (isEs ? 'Creando cuenta...' : 'Creating account...') : (isEs ? 'Crear cuenta' : 'Create account')}
      </button>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
        {isEs ? 'Ya tienes cuenta? ' : 'Already have an account? '}
        <a href={`/${locale}/login`} style={{ color: '#C8FF00', textDecoration: 'none' }}>
          {isEs ? 'Iniciar sesion' : 'Log in'}
        </a>
      </p>
    </form>
  )
}
