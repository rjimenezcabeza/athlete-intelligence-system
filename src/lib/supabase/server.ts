import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const getSvc = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

export function createAdminClient() {
  return createClient(getUrl(), getSvc(), {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// CRITICO: usa SERVICE_ROLE_KEY para leer cookies - evita el BOM de ANON_KEY
export async function createServerSideClient() {
  const cookieStore = await cookies()
  return createServerClient(getUrl(), getSvc(), {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })
}
