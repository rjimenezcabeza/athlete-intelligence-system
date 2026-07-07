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

    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: connections } = await (supabase as any)
      .from('wearable_connections')
      .select('provider, is_active, last_sync_at, sync_error, provider_data, provider_user_id')
      .eq('athlete_id', profile.id)

    const stravaConfigured = !!(
      process.env.STRAVA_CLIENT_ID &&
      process.env.STRAVA_CLIENT_ID !== 'PENDIENTE_REGISTRO_EN_STRAVA'
    )
    const garminConfigured = !!(
      process.env.GARMIN_CONSUMER_KEY &&
      process.env.GARMIN_CONSUMER_KEY !== 'PENDIENTE_REGISTRO_EN_GARMIN' &&
      process.env.GARMIN_CONSUMER_KEY !== 'PLACEHOLDER'
    )

    return NextResponse.json({
      strava: {
        available: stravaConfigured,
        connected: connections?.some((c: any) => c.provider === 'strava' && c.is_active) || false,
        lastSync: connections?.find((c: any) => c.provider === 'strava')?.last_sync_at || null,
        syncError: connections?.find((c: any) => c.provider === 'strava')?.sync_error || null,
        providerData: connections?.find((c: any) => c.provider === 'strava')?.provider_data || null,
        setupUrl: stravaConfigured ? null : 'https://www.strava.com/settings/api'
      },
      garmin: {
        available: garminConfigured,
        connected: connections?.some((c: any) => c.provider === 'garmin' && c.is_active) || false,
        lastSync: connections?.find((c: any) => c.provider === 'garmin')?.last_sync_at || null,
        syncError: connections?.find((c: any) => c.provider === 'garmin')?.sync_error || null,
        setupUrl: garminConfigured ? null : 'https://developer.garmin.com/gc-developer-program/overview/'
      },
      polar: {
        available: false,
        connected: false,
        lastSync: null,
        syncError: null,
        setupUrl: 'https://developer.polar.com/'
      }
    })
  } catch (error) {
    console.error('[wearables/status]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { provider } = body
    if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    await (supabase as any)
      .from('wearable_connections')
      .update({ is_active: false, access_token: null, refresh_token: null })
      .eq('athlete_id', profile.id)
      .eq('provider', provider)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[wearables/status DELETE]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
