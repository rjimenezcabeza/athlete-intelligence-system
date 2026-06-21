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
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const aid = profile.id

    const [patternsRes, recordsRes, muscleRes, recsRes, countRes] = await Promise.all([
      (admin as any)
        .from('athlete_patterns')
        .select('id, pattern_type, severity, title_es, title_en, description_es, description_en')
        .eq('athlete_id', aid).eq('is_active', true).eq('is_dismissed', false)
        .order('created_at', { ascending: false }).limit(5),

      (admin as any)
        .from('exercise_history')
        .select('best_weight_kg, total_sessions, exercises(name, muscle_group_primary)')
        .eq('athlete_id', aid)
        .not('best_weight_kg', 'is', null)
        .order('best_weight_kg', { ascending: false })
        .limit(5),

      (admin as any)
        .from('muscle_group_history')
        .select('muscle_group, volume_kg')
        .eq('athlete_id', aid)
        .gte('week_start', new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0])
        .order('volume_kg', { ascending: false }),

      (admin as any)
        .from('ai_recommendations')
        .select('id, recommendation_type, recommendation_text, created_at')
        .eq('athlete_id', aid)
        .order('created_at', { ascending: false }).limit(3),

      (admin as any)
        .from('training_sessions')
        .select('id').eq('athlete_id', aid).eq('status', 'completed')
    ])

    const volumeMap: Record<string, number> = {}
    for (const r of muscleRes.data ?? []) {
      volumeMap[r.muscle_group] = (volumeMap[r.muscle_group] ?? 0) + (r.volume_kg ?? 0)
    }
    const volumeByMuscle = Object.entries(volumeMap)
      .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume).slice(0, 6)

    return NextResponse.json({
      patterns: patternsRes.data ?? [],
      personalRecords: (recordsRes.data ?? []).map((h: any) => ({
        name: h.exercises?.name ?? 'Unknown',
        muscle: h.exercises?.muscle_group_primary ?? '',
        maxWeight: h.best_weight_kg,
        sessions: h.total_sessions
      })),
      volumeByMuscle,
      recommendations: recsRes.data ?? [],
      totalSessions: countRes.data?.length ?? 0
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
