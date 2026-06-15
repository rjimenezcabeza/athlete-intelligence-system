'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  locale: string
}

const NAV_ITEMS = [
  { href: 'dashboard', icon: 'o', label_es: 'Inicio',    label_en: 'Home'    },
  { href: 'import',   icon: 'i', label_es: 'Importar',  label_en: 'Import'  },
  { href: 'session/new', icon: '+', label_es: 'Entrenar', label_en: 'Train', primary: true },
  { href: 'history',  icon: '=', label_es: 'Historial', label_en: 'History' },
  { href: 'profile',  icon: 'u', label_es: 'Perfil',    label_en: 'Profile' },
]

export default function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname()
  const isEs = locale === 'es'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2"
      style={{
        background: '#0A0A0F',
        borderTop: '1px solid #1a1a2e',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        paddingTop: '12px'
      }}
    >
      {NAV_ITEMS.map(item => {
        const href = `/${locale}/${item.href}`
        const isActive = pathname === href || pathname.startsWith(`/${locale}/${item.href.split('/')[0]}`)

        if (item.primary) {
          return (
            <Link key={item.href} href={href}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl font-bold text-xl transition-all active:scale-90"
              style={{ background: '#C8FF00', color: '#0A0A0F' }}>
              {item.icon}
            </Link>
          )
        }

        return (
          <Link key={item.href} href={href} className="flex flex-col items-center gap-1 px-3 py-1">
            <span className="text-lg" style={{ color: isActive ? '#C8FF00' : '#555' }}>{item.icon}</span>
            <span className="text-xs" style={{ color: isActive ? '#C8FF00' : '#555' }}>
              {isEs ? item.label_es : item.label_en}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
