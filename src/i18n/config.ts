import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

export const locales = ['es', 'en', 'fr', 'de', 'it', 'nl'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale
  if (!locales.includes(locale as Locale)) notFound()
  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
