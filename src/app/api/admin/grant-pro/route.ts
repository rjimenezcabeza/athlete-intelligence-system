import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminDb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { email, revoke } = await req.json()
    if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

    const admin = adminDb()
    const { data: { users }, error: userError } = await (admin as any).auth.admin.listUsers()
    if (userError) throw userError

    const user = (users as any[]).find((u: any) => u.email === email)
    if (!user) return NextResponse.json({ error: `Usuario no encontrado: ${email}` }, { status: 404 })

    const tier = revoke ? 'free' : 'pro'
    const expiresAt = revoke ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const { error: updateError } = await (admin as any)
      .from('athlete_profiles')
      .update({ subscription_tier: tier, subscription_expires_at: expiresAt, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
    if (updateError) throw updateError

    return NextResponse.json({ success: true, email, tier, message: revoke ? 'Pro revocado' : 'Pro activado 1 año' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
