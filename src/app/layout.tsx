import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://athlete-intelligence-system.vercel.app'),
  title: {
    default: 'AIS — Athlete Intelligence System',
    template: '%s | AIS',
  },
  description: 'El sistema de memoria deportiva para atletas de hipertrofia. Importa, registra, progresa con IA.',
  keywords: ['hipertrofia', 'entrenamiento', 'bodybuilding', 'progresion', 'AI coach', 'gym tracker'],
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
