import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const getSvc = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(getUrl(), getSvc(), {
    cookies: { getAll() { return store.getAll() }, setAll() {} }
  })
  const { data: { user } } = await supa.auth.getUser()
  return user
}

function db() {
  return createClient(getUrl(), getSvc(), { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = db()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('id, display_name, subscription_tier, primary_goal, training_experience_years, import_onboarded_at')
      .eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const aid = profile.id

    const [sessionsRes, countRes] = await Promise.all([
      (admin as any)
        .from('training_sessions')
        .select('id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, status')
        .eq('athlete_id', aid).eq('status', 'completed')
        .order('session_date', { ascending: false }).limit(30),
      (admin as any)
        .from('training_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', aid).eq('status', 'completed')
    ])
    const sessions = sessionsRes.data
    const totalSessionsCount = countRes.count ?? 0

    let streak = 0
    if (sessions && sessions.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const dates = sessions.map((s: any) => {
        const d = new Date(s.session_date); d.setHours(0, 0, 0, 0); return d.getTime()
      })
      let check = today.getTime()
      for (const d of dates) {
        if (d === check || d === check - 86400000) { streak++; check = d - 86400000 } else break
      }
    }

    const { data: weeklyVolume } = await (admin as any)
      .from('muscle_group_history')
      .select('week_start, volume_kg, sets_count, muscle_group')
      .eq('athlete_id', aid).order('week_start', { ascending: false }).limit(64)

    const weekMap: Record<string, { volume: number; sets: number }> = {}
    if (weeklyVolume) {
      weeklyVolume.forEach((r: any) => {
        if (!weekMap[r.week_start]) weekMap[r.week_start] = { volume: 0, sets: 0 }
        weekMap[r.week_start].volume += r.volume_kg
        weekMap[r.week_start].sets += r.sets_count
      })
    }
    let weeklyChart = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b)).slice(-8)
      .map(([week, d]) => ({ week: week.slice(5), volume: Math.round(d.volume), sets: d.sets }))

    // Fallback: compute from sessions + sets if muscle_group_history is empty
    if (weeklyChart.length === 0 && sessions && sessions.length > 0) {
      const { data: setsData } = await (admin as any)
        .from('sets')
        .select('weight_kg, reps_completed, logged_at, session_exercises!inner(session_id, training_sessions!inner(athlete_id, session_date))')
        .eq('session_exercises.training_sessions.athlete_id', aid)
        .eq('set_type', 'working')
        .not('weight_kg', 'is', null)
        .not('reps_completed', 'is', null)

      if (setsData && setsData.length > 0) {
        const fallbackMap: Record<string, number> = {}
        setsData.forEach((s: any) => {
          const date = s.session_exercises?.training_sessions?.session_date
          if (!date) return
          const d = new Date(date)
          const day = d.getDay()
          const diff = d.getDate() - day + (day === 0 ? -6 : 1)
          const monday = new Date(d.setDate(diff))
          const weekKey = monday.toISOString().slice(0, 10)
          fallbackMap[weekKey] = (fallbackMap[weekKey] || 0) + (s.weight_kg || 0) * (s.reps_completed || 0)
        })
        weeklyChart = Object.entries(fallbackMap)
          .sort(([a], [b]) => a.localeCompare(b)).slice(-8)
          .map(([week, vol]) => ({ week: week.slice(5), volume: Math.round(vol), sets: 0 }))
      }
    }

    const { data: patterns } = await (admin as any)
      .from('athlete_patterns')
      .select('id, pattern_type, title_es, title_en, description_es, description_en, severity')
      .eq('athlete_id', aid).eq('is_active', true).eq('is_dismissed', false)
      .order('created_at', { ascending: false }).limit(3)

    const { data: progressions } = await (admin as any)
      .from('progression_log')
      .select('id, exercise_id, action_type, new_weight_kg, new_reps_target, reasoning_es, reasoning_en, created_at, exercises(name)')
      .eq('athlete_id', aid).order('created_at', { ascending: false }).limit(5)

    const { data: recommendations } = await (admin as any)
      .from('ai_recommendations')
      .select('id, recommendation_type, recommendation_text, created_at')
      .eq('athlete_id', aid).eq('user_action', 'pending')
      .order('created_at', { ascending: false }).limit(2)

    const last4 = (sessions || []).slice(0, 4)
    const avgFeedback = last4.length > 0 ? {
      pump:     last4.reduce((s: number, x: any) => s + (x.pump_rating ?? 0), 0) / last4.length,
      fatigue:  last4.reduce((s: number, x: any) => s + (x.local_fatigue ?? 0), 0) / last4.length,
      recovery: last4.reduce((s: number, x: any) => s + (x.perceived_recovery ?? 0), 0) / last4.length,
      rir:      last4.reduce((s: number, x: any) => s + (x.rir_session_avg ?? 0), 0) / last4.length,
    } : null

    return NextResponse.json({
      profile, weeklyChart,
      patterns: patterns || [],
      progressions: progressions || [],
      recommendations: recommendations || [],
      recentSessions: (sessions || []).slice(0, 7),
      stats: {
        totalSessions: totalSessionsCount,
        streak,
        avgDuration: sessions?.length
          ? Math.round(sessions.reduce((s: number, x: any) => s + (x.duration_minutes ?? 0), 0) / sessions.length)
          : 0,
        avgFeedback
      }
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
