'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS_ES = [
  { key: 'perfil',    label: 'Perfil',    suffix: '' },
  { key: 'metricas',  label: 'Métricas',  suffix: '/metrics' },
  { key: 'nutricion', label: 'Nutrición', suffix: '/nutrition' },
  { key: 'tecnica',   label: 'Técnica',   suffix: '/tecnica' },
  { key: 'historial', label: 'Historial', suffix: '/historial' },
]
const TABS_EN = [
  { key: 'profile',    label: 'Profile',    suffix: '' },
  { key: 'metrics',    label: 'Metrics',    suffix: '/metrics' },
  { key: 'nutrition',  label: 'Nutrition',  suffix: '/nutrition' },
  { key: 'technique',  label: 'Technique',  suffix: '/tecnica' },
  { key: 'history',    label: 'History',    suffix: '/historial' },
]

export function AthleteTabBar({ locale }: { locale: string }) {
  const pathname = usePathname()
  const isEs = locale !== 'en'
  const tabs = isEs ? TABS_ES : TABS_EN

  // Determine active tab by matching path suffix
  const activeKey = (() => {
    if (pathname.includes('/metrics'))   return isEs ? 'metricas'  : 'metrics'
    if (pathname.includes('/nutrition')) return isEs ? 'nutricion' : 'nutrition'
    if (pathname.includes('/tecnica'))   return isEs ? 'tecnica'   : 'technique'
    if (pathname.includes('/historial')) return isEs ? 'historial' : 'history'
    return isEs ? 'perfil' : 'profile'
  })()

  return (
    <>
      <style>{`
        .ath-tab-bar { overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .ath-tab-bar::-webkit-scrollbar { display: none; }
        .ath-tab { flex-shrink: 0; padding: 8px 16px; border-radius: 20px; font-size: 12px;
                   font-weight: 700; font-family: Syne, sans-serif; letter-spacing: 0.02em;
                   text-decoration: none; transition: all .18s; white-space: nowrap;
                   border: 1px solid transparent; }
        .ath-tab.active { background: var(--accent-color,#C8FF00); color: #0A0A0F; border-color: transparent; }
        .ath-tab.inactive { color: var(--text-secondary,#888); background: transparent;
                            border-color: rgba(255,255,255,0.06); }
        .ath-tab.inactive:active { background: rgba(255,255,255,0.06); }
      `}</style>
      <div className="ath-tab-bar" style={{
        display: 'flex', gap: 6, padding: '0 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {tabs.map(tab => {
          const href = `/${locale}/athlete${tab.suffix}`
          const isActive = activeKey === tab.key
          return (
            <Link
              key={tab.key}
              href={href}
              className={`ath-tab ${isActive ? 'active' : 'inactive'}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
