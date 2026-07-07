import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function db() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
async function getUser() {
  const store = await cookies()
  const s = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll() { return store.getAll() }, setAll() {} } }
  )
  return (await s.auth.getUser()).data.user
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ session: null })
    const admin = db()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ session: null })
    const { data: session } = await (admin as any)
      .from('training_sessions')
      .select('id, athlete_id, session_date, started_at, status, template_id, day_number, day_label')
      .eq('athlete_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1).single()
    return NextResponse.json({ session: session ?? null })
  } catch {
    return NextResponse.json({ session: null })
  }
}
