'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const NAV = [
  { href: 'dashboard', Icon: HomeIcon, es: 'Inicio', en: 'Home' },
  { href: 'athlete', Icon: UserIcon, es: 'Atleta', en: 'Athlete' },
  { href: 'session/new', Icon: PlusIcon, es: null, en: null, primary: true },
  { href: 'history', Icon: ClockIcon, es: 'Historial', en: 'History' },
  { href: 'profile', Icon: UserIcon, es: 'Perfil', en: 'Profile' },
]

export default function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname()
  const isEs = locale === 'es'

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.97)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      paddingBottom: 'max(env(safe-area-inset-bottom),12px)',
      paddingTop: 10, paddingLeft: 8, paddingRight: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around'
    }}>
      {NAV.map(item => {
        const href = '/' + locale + '/' + item.href
        const base = item.href.split('/')[0]
        const isActive = pathname === href || (base !== 'session' && pathname.includes('/' + locale + '/' + base))

        if (item.primary) return (
          <Link key={item.href} href={href} className="pulse-acc" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 58, height: 58, borderRadius: 18,
            background: 'linear-gradient(135deg,#C8FF00,#88DD00)',
            color: '#0A0A0F', marginTop: -18,
            transition: 'transform 0.15s'
          }}>
            <item.Icon />
          </Link>
        )

        return (
          <Link key={item.href} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 12px',
            color: isActive ? '#C8FF00' : '#44445a',
            transition: 'color 0.2s, transform 0.15s',
            transform: isActive ? 'scale(1.08)' : 'scale(1)',
          }}>
            <item.Icon />
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em' }}>
              {isEs ? item.es : item.en}
            </span>
          </Link>
        )
      })}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes pulseAcc{0%,100%{box-shadow:0 0 0 0 rgba(200,255,0,0.4),0 0 24px rgba(200,255,0,0.2)}50%{box-shadow:0 0 0 8px rgba(200,255,0,0),0 0 32px rgba(200,255,0,0.35)}}.pulse-acc{animation:pulseAcc 2.5s ease-in-out infinite}' }} />
    </nav>
  )
}
