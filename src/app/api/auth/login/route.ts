import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const cookieStore = await cookies()
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
    console.log('[login] url[0]:', url.charCodeAt(0), 'key[0]:', anonKey.charCodeAt(0))
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          toSet.forEach(({ name, value, options }) => (cookieStore as any).set(name, value, options))
        }
      }
    })
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      console.error('[login] error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ success: true, user: { id: data.user.id, email: data.user.email } })
  } catch (err) {
    console.error('[login] catch:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}