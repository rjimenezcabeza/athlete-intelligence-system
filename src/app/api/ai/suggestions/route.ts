import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

function adminDb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll() { return store.getAll() }, setAll() {} } }
  )
  return (await supa.auth.getUser()).data.user
}

export async function POST() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id, display_name, primary_goal, training_experience_years').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [sessionsRes, progressionRes] = await Promise.all([
      (admin as any).from('training_sessions')
        .select('id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, status')
        .eq('athlete_id', profile.id)
        .gte('session_date', thirtyDaysAgo)
        .order('session_date', { ascending: false })
        .limit(30),
      (admin as any).from('progression_log')
        .select('action_type, new_weight_kg, new_reps_target, reasoning_en, created_at, exercises(name)')
        .eq('athlete_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    const sessions = sessionsRes.data ?? []
    const progressions = progressionRes.data ?? []

    if (sessions.length < 2) {
      return NextResponse.json({ suggestions: [], reason: 'insufficient_data' })
    }

    const avgFatigue = sessions.filter((s: any) => s.local_fatigue != null).reduce((a: number, s: any) => a + s.local_fatigue, 0) / Math.max(1, sessions.filter((s: any) => s.local_fatigue != null).length)
    const avgPump = sessions.filter((s: any) => s.pump_rating != null).reduce((a: number, s: any) => a + s.pump_rating, 0) / Math.max(1, sessions.filter((s: any) => s.pump_rating != null).length)
    const avgRIR = sessions.filter((s: any) => s.rir_session_avg != null).reduce((a: number, s: any) => a + s.rir_session_avg, 0) / Math.max(1, sessions.filter((s: any) => s.rir_session_avg != null).length)

    const dataContext = `Athlete: ${profile.display_name}, Goal: ${profile.primary_goal}, Experience: ${profile.training_experience_years} years
Last 30 days: ${sessions.length} sessions
Avg fatigue: ${avgFatigue.toFixed(1)}/5, Avg pump: ${avgPump.toFixed(1)}/5, Avg RIR: ${avgRIR.toFixed(1)}
Recent sessions (last 7): ${JSON.stringify(sessions.slice(0, 7).map((s: any) => ({ date: s.session_date, duration: s.duration_minutes, fatigue: s.local_fatigue, pump: s.pump_rating, recovery: s.perceived_recovery, rir: s.rir_session_avg })))}
Recent progressions: ${JSON.stringify(progressions.slice(0, 5).map((p: any) => ({ exercise: p.exercises?.name, action: p.action_type, newWeight: p.new_weight_kg })))}`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are an expert strength coach AI. Based on this athlete's data, generate 3-5 specific, actionable suggestions.

${dataContext}

Return ONLY valid JSON array (no markdown):
[
  {
    "id": "unique_id",
    "recommendation_type": "volume_adjustment|recovery_warning|progression_opportunity|technique_reminder|consistency",
    "recommendation_text": "Specific, personalized suggestion in 1-2 sentences",
    "priority": "high|medium|low"
  }
]

Types:
- volume_adjustment: training volume changes
- recovery_warning: fatigue/recovery issues (if avg fatigue > 3.5)
- progression_opportunity: ready to increase weight/reps
- technique_reminder: RIR/effort concerns (if avg RIR < 1)
- consistency: attendance patterns

Be specific with numbers. Reference the actual data.`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const suggestions = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Guardar en ai_recommendations
    if (suggestions.length > 0) {
      const toInsert = suggestions.map((s: any) => ({
        athlete_id: profile.id,
        recommendation_type: s.recommendation_type,
        recommendation_text: s.recommendation_text,
        priority: s.priority ?? 'medium',
        created_at: new Date().toISOString()
      }))
      await (admin as any).from('ai_recommendations').insert(toInsert).select()
    }

    return NextResponse.json({ suggestions, sessionsAnalyzed: sessions.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ suggestions: [] })

    const { data } = await (admin as any)
      .from('ai_recommendations')
      .select('id, recommendation_type, recommendation_text, priority, created_at')
      .eq('athlete_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({ suggestions: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
