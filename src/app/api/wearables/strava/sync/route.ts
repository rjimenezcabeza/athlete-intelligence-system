import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { refreshStravaToken } from '@/lib/strava'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await (supabase as any).auth.getUser()

    let athleteId = body.athleteId
    if (!athleteId && user) {
      const { data: profile } = await (supabase as any)
        .from('athlete_profiles').select('id').eq('user_id', user.id).single()
      athleteId = profile?.id
    }

    if (!athleteId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accessToken = await refreshStravaToken(supabase, athleteId)
    if (!accessToken) {
      return NextResponse.json({ error: 'Strava not connected or token expired' }, { status: 400 })
    }

    const after = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000)
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!activitiesRes.ok) {
      await (supabase as any).from('wearable_connections')
        .update({ sync_error: `Strava API error: ${activitiesRes.status}`, updated_at: new Date().toISOString() })
        .eq('athlete_id', athleteId).eq('provider', 'strava')
      return NextResponse.json({ error: 'Strava API error' }, { status: 502 })
    }

    const activities = await activitiesRes.json()

    const { data: existing } = await (supabase as any)
      .from('wearable_connections')
      .select('provider_data')
      .eq('athlete_id', athleteId)
      .eq('provider', 'strava')
      .single()

    const summary = {
      lastSync: new Date().toISOString(),
      totalActivities: activities.length,
      recentActivities: activities.slice(0, 10).map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        date: a.start_date_local?.split('T')[0],
        distanceKm: a.distance ? Math.round(a.distance / 100) / 10 : null,
        durationMin: a.moving_time ? Math.round(a.moving_time / 60) : null,
        elevationGain: a.total_elevation_gain || null,
        avgHeartRate: a.average_heartrate || null,
        maxHeartRate: a.max_heartrate || null,
        calories: a.calories || null,
        sufferScore: a.suffer_score || null
      }))
    }

    await (supabase as any)
      .from('wearable_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: null,
        provider_data: { ...(existing?.provider_data || {}), ...summary },
        updated_at: new Date().toISOString()
      })
      .eq('athlete_id', athleteId)
      .eq('provider', 'strava')

    return NextResponse.json({ ok: true, synced: activities.length, lastSync: new Date().toISOString() })
  } catch (error) {
    console.error('[strava/sync]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
