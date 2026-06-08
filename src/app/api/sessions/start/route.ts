import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Buscar o crear athlete_profile en un solo paso
    let { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
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
        .select('id')
        .single()

      if (createError || !newProfile) {
        return NextResponse.json(
          { error: 'No se pudo crear el perfil', details: createError?.message },
          { status: 500 }
        )
      }
      profile = newProfile
    }

    // Parsear body — puede venir vacío o con templateId
    let templateId: string | null = null
    try {
      const body = await req.json()
      templateId = body?.templateId ?? null
    } catch {}

    const { data: session, error: sessionError } = await (supabase as any)
      .from('training_sessions')
      .insert({
        athlete_id: profile.id,
        template_id: templateId,
        session_date: new Date().toISOString().split('T')[0],
        started_at: new Date().toISOString(),
        source: 'manual',
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No se pudo crear la sesión', details: sessionError?.message },
        { status: 500 }
      )
    }

    // Devolver sessionId (camelCase) para compatibilidad con StartSessionButton
    return NextResponse.json({ sessionId: session.id }, { status: 201 })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}
