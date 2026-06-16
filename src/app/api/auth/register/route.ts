import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, displayName, locale } = await request.json()
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
    // Log para diagnostico
    console.log('[register] url length:', url.length, 'key length:', key.length)
    console.log('[register] url[0] charCode:', url.charCodeAt(0))
    console.log('[register] key[0] charCode:', key.charCodeAt(0))
    const supabase = createClient(url, key)
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      user_metadata: { display_name: displayName },
      email_confirm: true
    })
    if (error) {
      console.error('[register] supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (data.user) {
      await supabase.from('athlete_profiles').insert({
        user_id: data.user.id,
        display_name: displayName?.trim(),
        weight_unit: 'kg',
        language: locale ?? 'es',
        timezone: 'Europe/Madrid',
        subscription_tier: 'free',
      })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[register] catch:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}