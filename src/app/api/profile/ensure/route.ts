import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  void req
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Si ya existe, devolver
  const { data: existing } = await (supabase as any)
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) return NextResponse.json({ profileId: existing.id, created: false })

  // Crear perfil nuevo
  const { data: profile, error } = await (supabase as any)
    .from('athlete_profiles')
    .insert({
      user_id: user.id,
      display_name: user.email?.split('@')[0] ?? 'Athlete',
      language: 'es',
      subscription_tier: 'free',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profileId: profile.id, created: true })
}
