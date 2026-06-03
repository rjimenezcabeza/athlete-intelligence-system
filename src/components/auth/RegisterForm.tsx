'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterForm() {
  const router = useRouter(); const locale = useLocale(); const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('athlete_profiles').insert({
        user_id: data.user.id, display_name: displayName,
        weight_unit: 'kg', language: locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        subscription_tier: 'free',
      })
    }
    router.push(`/${locale}/dashboard`); router.refresh()
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="atleta@ejemplo.com" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</Button>
      <p className="text-center text-sm text-muted-foreground">¿Ya tienes cuenta?{' '}<a href={`/${locale}/login`} className="text-primary hover:underline">Iniciar sesión</a></p>
    </form>
  )
}
