import { NextResponse } from 'next/server'

// GET /api/wearables/connect?provider=strava
// Inicia flujo OAuth del provider
export async function GET(request: Request) {
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider')

  if (!provider) {
    return NextResponse.json({ error: 'Provider required' }, { status: 400 })
  }

  const OAUTH_CONFIGS: Record<string, { authUrl: string; scope: string; clientId: string }> = {
    strava: {
      authUrl: 'https://www.strava.com/oauth/authorize',
      scope: 'read,activity:read',
      clientId: process.env.STRAVA_CLIENT_ID || 'PLACEHOLDER_STRAVA_CLIENT_ID',
    },
    garmin: {
      authUrl: 'https://connect.garmin.com/oauthConfirm',
      scope: 'CONNECT_READ',
      clientId: process.env.GARMIN_CONSUMER_KEY || 'PLACEHOLDER_GARMIN_KEY',
    },
    polar: {
      authUrl: 'https://flow.polar.com/oauth2/authorization',
      scope: 'accesslink.read_all',
      clientId: process.env.POLAR_CLIENT_ID || 'PLACEHOLDER_POLAR_CLIENT_ID',
    },
  }

  const config = OAUTH_CONFIGS[provider]
  if (!config) {
    return NextResponse.json({ error: `Provider ${provider} not supported` }, { status: 400 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/callback`
  const state = Buffer.from(JSON.stringify({ provider, ts: Date.now() })).toString('base64')

  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', config.scope)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
