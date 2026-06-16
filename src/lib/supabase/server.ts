import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// Cliente admin con SERVICE_ROLE_KEY — sin BOM, sin browser
export function createAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Cliente SSR para leer sesion desde cookies (login/logout/getUser)
export async function createServerSideClient() {
  const cookieStore = await cookies()
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })
}