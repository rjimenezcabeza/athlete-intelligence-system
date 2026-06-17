import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const svc = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
    const response = NextResponse.json({ success: true })
    const supabase = createServerClient(url, svc, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }: any) => {
            cookieStore.set(name, value, options)
            response.cookies.set(name, value, options)
          })
        }
      }
    })
    await supabase.auth.signOut()
    return response
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
