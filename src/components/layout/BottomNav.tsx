'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  locale: string
}

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const ImportIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const HistoryIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const ProfileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const NAV_ITEMS = [
  { href: 'dashboard',    Icon: HomeIcon,    label_es: 'Inicio',    label_en: 'Home'    },
  { href: 'import',       Icon: ImportIcon,  label_es: 'Importar',  label_en: 'Import'  },
  { href: 'session/new',  Icon: PlusIcon,    label_es: 'Entrenar',  label_en: 'Train',  primary: true },
  { href: 'history',      Icon: HistoryIcon, label_es: 'Historial', label_en: 'History' },
  { href: 'profile',      Icon: ProfileIcon, label_es: 'Perfil',    label_en: 'Profile' },
]

export default function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname()
  const isEs = locale === 'es'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2"
      style={{
        background: 'rgba(10, 10, 15, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        paddingTop: '10px',
      }}
    >
      {NAV_ITEMS.map(item => {
        const href = `/${locale}/${item.href}`
        const isActive = pathname === href || pathname.startsWith(`/${locale}/${item.href.split('/')[0]}`)

        if (item.primary) {
          return (
            <Link key={item.href} href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #C8FF00 0%, #88DD00 100%)',
                color: '#0A0A0F',
                marginTop: '-16px',
                boxShadow: '0 0 24px rgba(200, 255, 0, 0.35)',
                animation: 'pulse-accent 2s infinite',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <item.Icon />
            </Link>
          )
        }

        return (
          <Link key={item.href} href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              color: isActive ? '#C8FF00' : '#555',
              transition: 'color 0.2s ease, transform 0.15s ease',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <item.Icon />
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.04em',
            }}>
              {isEs ? item.label_es : item.label_en}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
