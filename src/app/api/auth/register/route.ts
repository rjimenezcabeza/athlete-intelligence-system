import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, displayName, locale } = await request.json()
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } }
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (data.user) {
    await (supabase as any).from('athlete_profiles').insert({
      user_id: data.user.id,
      display_name: displayName,
      weight_unit: 'kg',
      language: locale,
      timezone: 'Europe/Madrid',
      subscription_tier: 'free',
    })
  }

  return NextResponse.json({ success: true })
}
