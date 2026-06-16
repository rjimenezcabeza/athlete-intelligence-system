import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
})

export async function proxy(request: NextRequest) {
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/'],
}