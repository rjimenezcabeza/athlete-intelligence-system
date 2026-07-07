import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: active } = await (supabase as any)
      .from('mesocycles')
      .select(`
        id, name, goal, total_weeks, current_week,
        started_at, ended_at, status, deload_week, notes,
        training_templates(name, split_type, training_days_per_week)
      `)
      .eq('athlete_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!active) return NextResponse.json({ mesocycle: null })

    const startDate = new Date(active.started_at)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const calculatedWeek = Math.min(Math.floor(diffDays / 7) + 1, active.total_weeks)

    if (calculatedWeek !== active.current_week) {
      await (supabase as any)
        .from('mesocycles')
        .update({ current_week: calculatedWeek })
        .eq('id', active.id)
    }

    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (calculatedWeek - 1) * 7)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const { count: sessionsThisWeek } = await (supabase as any)
      .from('training_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', profile.id)
      .eq('mesocycle_id', active.id)
      .gte('session_date', weekStartStr)
      .lte('session_date', weekEndStr)

    return NextResponse.json({
      mesocycle: {
        ...active,
        current_week: calculatedWeek,
        sessions_this_week: sessionsThisWeek || 0,
        week_start: weekStartStr,
        is_deload_week: active.deload_week === calculatedWeek,
        progress_percent: Math.round((calculatedWeek / active.total_weeks) * 100)
      }
    })
  } catch (error) {
    console.error('[mesocycles GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, goal, totalWeeks, templateId, deloadWeek, startDate } = body
    if (!name || !totalWeeks) {
      return NextResponse.json({ error: 'name and totalWeeks are required' }, { status: 400 })
    }

    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    await (supabase as any)
      .from('mesocycles')
      .update({ status: 'completed', ended_at: new Date().toISOString().split('T')[0] })
      .eq('athlete_id', profile.id)
      .eq('status', 'active')

    const { data: mesocycle, error } = await (supabase as any)
      .from('mesocycles')
      .insert({
        athlete_id: profile.id,
        template_id: templateId || null,
        name,
        goal: goal || null,
        total_weeks: totalWeeks,
        current_week: 1,
        started_at: startDate || new Date().toISOString().split('T')[0],
        status: 'active',
        deload_week: deloadWeek || null
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ mesocycle }, { status: 201 })
  } catch (error) {
    console.error('[mesocycles POST]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
