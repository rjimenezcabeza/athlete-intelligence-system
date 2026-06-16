import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const cookieStore = await cookies()
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
    const successResponse = NextResponse.json({ success: true })
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }: any) => {
            cookieStore.set(name, value, options)
            successResponse.cookies.set(name, value, options as any)
          })
        }
      }
    })
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    return successResponse
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}