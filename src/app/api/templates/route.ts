import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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

    const { data: templates } = await (supabase as any)
      .from('training_templates')
      .select('id, name, training_days_per_week, split_type, mesocycle_weeks, is_active')
      .eq('athlete_id', profile.id)
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('[templates]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
