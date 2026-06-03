'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const router = useRouter(); const locale = useLocale(); const supabase = createClient()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/${locale}/dashboard`); router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="atleta@ejemplo.com" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Iniciando...' : 'Iniciar sesión'}</Button>
      <p className="text-center text-sm text-muted-foreground">¿No tienes cuenta?{' '}<a href={`/${locale}/register`} className="text-primary hover:underline">Crear cuenta</a></p>
    </form>
  )
}
