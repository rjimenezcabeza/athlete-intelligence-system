import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Athlete Intelligence System',
  description: 'Sistema operativo para atletas de hipertrofia',
  manifest: '/manifest.json',
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale as 'es' | 'en')) notFound()
  const messages = await getMessages()
  return (
    <html lang={locale} suppressHydrationWarning>
      <head><link rel="manifest" href="/manifest.json" /></head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}` }} />
      </body>
    </html>
  )
}
