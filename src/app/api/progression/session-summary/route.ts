import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: suggestions } = await (supabase as any)
      .from('progression_log')
      .select(`
        id,
        action_type,
        prev_weight_kg,
        new_weight_kg,
        new_reps_target,
        reasoning_es,
        reasoning_en,
        applied,
        created_at,
        exercises(name, muscle_group_primary)
      `)
      .eq('athlete_id', profile.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    return NextResponse.json({ suggestions: suggestions || [] })
  } catch (error) {
    console.error('[progression/session-summary]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { suggestionId, applied } = body
    if (!suggestionId) return NextResponse.json({ error: 'Missing suggestionId' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    await (supabase as any)
      .from('progression_log')
      .update({ applied: applied ?? true, applied_at: new Date().toISOString() })
      .eq('id', suggestionId)
      .eq('athlete_id', profile.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[progression/session-summary PATCH]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
