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

    const clientId = (process.env.STRAVA_CLIENT_ID ?? '').trim()
    if (!clientId || clientId === 'PENDIENTE_REGISTRO_EN_STRAVA') {
      return NextResponse.json({
        error: 'STRAVA_NOT_CONFIGURED',
        message: 'Strava app not registered yet. Register at strava.com/settings/api',
        setupUrl: 'https://www.strava.com/settings/api'
      }, { status: 503 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim() || 'https://athlete-intelligence-system.vercel.app'
    const redirectUri = `${appUrl}/api/wearables/strava/callback`
    const scope = 'read,activity:read_all'
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64url')

    const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize')
    stravaAuthUrl.searchParams.set('client_id', clientId)
    stravaAuthUrl.searchParams.set('response_type', 'code')
    stravaAuthUrl.searchParams.set('redirect_uri', redirectUri)
    stravaAuthUrl.searchParams.set('scope', scope)
    stravaAuthUrl.searchParams.set('state', state)

    return NextResponse.redirect(stravaAuthUrl.toString())
  } catch (error) {
    console.error('[strava/connect]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
