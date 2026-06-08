import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AIS — Athlete Intelligence System',
  description: 'Sistema operativo para atletas de hipertrofia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  )
}
