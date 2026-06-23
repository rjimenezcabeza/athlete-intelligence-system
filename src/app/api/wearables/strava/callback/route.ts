import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim() || 'https://athlete-intelligence-system.vercel.app'

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error || !code) {
      return NextResponse.redirect(`${appUrl}/es/profile?wearable=strava&status=denied`)
    }

    let userId: string
    try {
      const decoded = JSON.parse(Buffer.from(state || '', 'base64url').toString())
      userId = decoded.userId
    } catch {
      return NextResponse.redirect(`${appUrl}/es/profile?wearable=strava&status=error`)
    }

    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: (process.env.STRAVA_CLIENT_ID ?? '').trim(),
        client_secret: (process.env.STRAVA_CLIENT_SECRET ?? '').trim(),
        code,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/es/profile?wearable=strava&status=error`)
    }

    const tokenData = await tokenRes.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.redirect(`${appUrl}/es/profile?wearable=strava&status=error`)
    }

    await (supabase as any)
      .from('wearable_connections')
      .upsert({
        athlete_id: profile.id,
        provider: 'strava',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        is_active: true,
        provider_user_id: String(tokenData.athlete?.id || ''),
        provider_data: {
          athlete_name: `${tokenData.athlete?.firstname || ''} ${tokenData.athlete?.lastname || ''}`.trim(),
          profile_medium: tokenData.athlete?.profile_medium
        }
      }, { onConflict: 'athlete_id,provider' })

    fetch(`${appUrl}/api/wearables/strava/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId: profile.id })
    }).catch(() => {})

    return NextResponse.redirect(`${appUrl}/es/profile?wearable=strava&status=connected`)
  } catch (error) {
    console.error('[strava/callback]', error)
    return NextResponse.redirect(`${appUrl}/es/profile?wearable=strava&status=error`)
  }
}
