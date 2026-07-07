import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST() {
  const store = await cookies()
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
    {
      cookies: {
        getAll() { return store.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => store.set(name, value, options)) }
      }
    }
  )
  await supabase.auth.signOut()
  const res = NextResponse.json({ success: true })
  store.getAll().forEach(c => res.cookies.delete(c.name))
  return res
}
