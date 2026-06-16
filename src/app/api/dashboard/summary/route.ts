import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

    // Usar SERVICE_ROLE_KEY para leer el JWT de las cookies sin BOM
    const supabase = createServerClient(url, serviceKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin client para queries (SERVICE_ROLE_KEY, sin RLS issues)
    const admin = createClient(url, serviceKey)

    const { data: profile } = await admin
      .from('athlete_profiles')
      .select('id, display_name, subscription_tier, primary_goal, training_experience_years')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const aid = profile.id

    const { data: sessions } = await admin
      .from('training_sessions')
      .select('id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, status')
      .eq('athlete_id', aid)
      .eq('status', 'completed')
      .order('session_date', { ascending: false })
      .limit(30)

    let streak = 0
    if (sessions && sessions.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dayMs = 86400000
      let check = today.getTime()
      for (const s of sessions) {
        const d = new Date(s.session_date)
        d.setHours(0, 0, 0, 0)
        if (d.getTime() === check || d.getTime() === check - dayMs) {
          streak++
          check = d.getTime() - dayMs
        } else break
      }
    }

    const { data: weeklyVolume } = await admin
      .from('muscle_group_history')
      .select('week_start, volume_kg, sets_count')
      .eq('athlete_id', aid)
      .order('week_start', { ascending: false })
      .limit(64)

    const weekMap: Record<string, { volume: number; sets: number }> = {}
    if (weeklyVolume) {
      weeklyVolume.forEach((r: any) => {
        if (!weekMap[r.week_start]) weekMap[r.week_start] = { volume: 0, sets: 0 }
        weekMap[r.week_start].volume += r.volume_kg ?? 0
        weekMap[r.week_start].sets += r.sets_count ?? 0
      })
    }
    const weeklyChart = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, d]) => ({ week: week.slice(5), volume: Math.round(d.volume), sets: d.sets }))

    const { data: patterns } = await admin
      .from('athlete_patterns')
      .select('id, pattern_type, title_es, title_en, description_es, description_en, severity')
      .eq('athlete_id', aid)
      .eq('is_active', true)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: progressions } = await admin
      .from('progression_log')
      .select('id, exercise_id, action_type, new_weight_kg, new_reps_target, reasoning_es, reasoning_en, created_at, exercises(name)')
      .eq('athlete_id', aid)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recommendations } = await admin
      .from('ai_recommendations')
      .select('id, recommendation_type, recommendation_text, created_at')
      .eq('athlete_id', aid)
      .eq('user_action', 'pending')
      .order('created_at', { ascending: false })
      .limit(2)

    const last4 = (sessions || []).slice(0, 4)
    const avgFeedback = last4.length > 0 ? {
      pump: last4.reduce((s: number, x: any) => s + (x.pump_rating ?? 0), 0) / last4.length,
      fatigue: last4.reduce((s: number, x: any) => s + (x.local_fatigue ?? 0), 0) / last4.length,
      recovery: last4.reduce((s: number, x: any) => s + (x.perceived_recovery ?? 0), 0) / last4.length,
      rir: last4.reduce((s: number, x: any) => s + (x.rir_session_avg ?? 0), 0) / last4.length,
    } : null

    return NextResponse.json({
      profile,
      stats: {
        totalSessions: (sessions || []).length,
        streak,
        avgDuration: sessions && sessions.length > 0
          ? Math.round(sessions.reduce((s: number, x: any) => s + (x.duration_minutes ?? 0), 0) / sessions.length)
          : 0,
        avgFeedback,
      },
      weeklyChart,
      patterns: patterns || [],
      progressions: progressions || [],
      recommendations: recommendations || [],
      recentSessions: (sessions || []).slice(0, 7),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
