import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
})

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPath = ['/login', '/register', '/auth'].some(p => pathname.includes(p))
  const response = intlMiddleware(request) ?? NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isAuthPath && pathname.includes('/dashboard')) {
    const locale = pathname.split('/')[1] || 'es'
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)', '/'],
}
