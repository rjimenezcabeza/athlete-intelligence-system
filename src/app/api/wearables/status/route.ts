import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/wearables/status — lista conexiones del atleta
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: connections } = await (supabase as any)
    .from('wearable_connections')
    .select('provider, is_active, last_sync_at, provider_data')
    .eq('athlete_id', profile.id)

  return NextResponse.json({ data: connections || [] })
}

// DELETE /api/wearables/status?provider=strava — desconectar
export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const url = new URL(request.url)
  const provider = url.searchParams.get('provider')

  await (supabase as any)
    .from('wearable_connections')
    .delete()
    .eq('athlete_id', profile.id)
    .eq('provider', provider)

  return NextResponse.json({ success: true })
}
