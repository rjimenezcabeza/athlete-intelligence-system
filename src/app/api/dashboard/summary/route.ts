import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createDb() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      }
    }
  )
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createDb()
    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id, display_name, subscription_tier, primary_goal, training_experience_years')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const aid = profile.id

    const { data: sessions } = await (supabase as any)
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
      const dates = sessions.map((s: any) => {
        const d = new Date(s.session_date)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
      const dayMs = 86400000
      let check = today.getTime()
      for (const d of dates) {
        if (d === check || d === check - dayMs) {
          streak++
          check = d - dayMs
        } else break
      }
    }

    const { data: weeklyVolume } = await (supabase as any)
      .from('muscle_group_history')
      .select('week_start, volume_kg, sets_count, muscle_group')
      .eq('athlete_id', aid)
      .order('week_start', { ascending: false })
      .limit(64)

    const weekMap: Record<string, { volume: number; sets: number }> = {}
    if (weeklyVolume) {
      weeklyVolume.forEach((r: any) => {
        if (!weekMap[r.week_start]) weekMap[r.week_start] = { volume: 0, sets: 0 }
        weekMap[r.week_start].volume += r.volume_kg
        weekMap[r.week_start].sets += r.sets_count
      })
    }
    const weeklyChart = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, d]) => ({ week: week.slice(5), volume: Math.round(d.volume), sets: d.sets }))

    const { data: patterns } = await (supabase as any)
      .from('athlete_patterns')
      .select('id, pattern_type, title_es, title_en, description_es, description_en, severity')
      .eq('athlete_id', aid)
      .eq('is_active', true)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: progressions } = await (supabase as any)
      .from('progression_log')
      .select('id, exercise_id, action_type, new_weight_kg, new_reps_target, reasoning_es, reasoning_en, created_at, exercises(name)')
      .eq('athlete_id', aid)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recommendations } = await (supabase as any)
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
        avgFeedback
      },
      weeklyChart,
      patterns: patterns || [],
      progressions: progressions || [],
      recommendations: recommendations || [],
      recentSessions: (sessions || []).slice(0, 7)
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
