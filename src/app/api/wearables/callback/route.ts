import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/wearables/callback?code=xxx&state=xxx
export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id, language')
    .eq('user_id', user.id)
    .single()

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const lang = profile?.language || 'es'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (error || !code || !state) {
    return NextResponse.redirect(new URL(`/${lang}/settings?wearable_error=auth_failed`, appUrl))
  }

  let provider = 'unknown'
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    provider = stateData.provider
  } catch {
    return NextResponse.redirect(new URL(`/${lang}/settings?wearable_error=invalid_state`, appUrl))
  }

  await (supabase as any)
    .from('wearable_connections')
    .upsert({
      athlete_id: profile.id,
      provider,
      access_token: `PENDING_EXCHANGE_${code}`,
      is_active: false,
      provider_data: { oauth_code: code, connected_at: new Date().toISOString() }
    }, { onConflict: 'athlete_id,provider' })

  return NextResponse.redirect(new URL(`/${lang}/settings?wearable_connected=${provider}`, appUrl))
}
