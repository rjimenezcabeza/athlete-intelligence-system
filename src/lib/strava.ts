export async function refreshStravaToken(supabase: any, athleteId: string): Promise<string | null> {
  const { data: conn } = await (supabase as any)
    .from('wearable_connections')
    .select('refresh_token, token_expires_at')
    .eq('athlete_id', athleteId)
    .eq('provider', 'strava')
    .eq('is_active', true)
    .single()

  if (!conn) return null

  const expiresAt = new Date(conn.token_expires_at).getTime()
  if (Date.now() < expiresAt - 60000) {
    const { data } = await (supabase as any)
      .from('wearable_connections')
      .select('access_token')
      .eq('athlete_id', athleteId)
      .eq('provider', 'strava')
      .single()
    return data?.access_token || null
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: conn.refresh_token
    })
  })

  if (!res.ok) return null
  const newToken = await res.json()

  await (supabase as any)
    .from('wearable_connections')
    .update({
      access_token: newToken.access_token,
      refresh_token: newToken.refresh_token,
      token_expires_at: new Date(newToken.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('athlete_id', athleteId)
    .eq('provider', 'strava')

  return newToken.access_token
}

export function metersToKm(m: number): number {
  return Math.round(m / 10) / 100
}

export function secondsToMinutes(s: number): number {
  return Math.round(s / 60)
}
