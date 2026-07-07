import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  void req
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id, display_name, subscription_tier')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      const { data: newProfile, error: createError } = await (supabase as any)
        .from('athlete_profiles')
        .insert({
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'Atleta',
          subscription_tier: 'free',
          weight_unit: 'kg',
          language: 'es',
          timezone: 'Europe/Madrid',
        })
        .select('id, display_name, subscription_tier')
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }
      profile = newProfile
    }

    return NextResponse.json({ profile }, { status: 200 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
