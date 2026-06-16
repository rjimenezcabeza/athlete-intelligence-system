import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const serviceKey = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
const anonKey = () => (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

// Admin client — usa SERVICE_ROLE_KEY, sin BOM, para queries
export function createAdminClient() {
  return createClient(url(), serviceKey(), {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// SSR client — usa anon key para leer/escribir cookies de sesion
export async function createServerSideClient() {
  const cookieStore = await cookies()
  return createServerClient(url(), anonKey(), {
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

// Obtener user_id desde cookies usando SERVICE_ROLE_KEY para validar JWT
// Esto evita el BOM en browser pero en Node el BOM no afecta a fetch
export async function getUserFromCookies() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  // Buscar el access token en las cookies de Supabase
  const tokenCookie = allCookies.find(c =>
    c.name.includes('access-token') || c.name.includes('auth-token') || c.name.startsWith('sb-')
  )
  if (!tokenCookie) return null
  try {
    const admin = createAdminClient()
    // Intentar con SSR client primero (lee JWT de cookies)
    const supa = createServerClient(url(), serviceKey(), {
      cookies: {
        getAll() { return allCookies },
        setAll() {},
      },
    })
    const { data: { user } } = await supa.auth.getUser()
    return user
  } catch {
    return null
  }
}
