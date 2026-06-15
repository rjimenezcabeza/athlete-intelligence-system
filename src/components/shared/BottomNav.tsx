'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, Brain, Bot, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { href: '/training/session', icon: Dumbbell, label: 'Entrenar' },
  { href: '/training/templates', icon: ClipboardList, label: 'Rutinas' },
  { href: '/memory', icon: Brain, label: 'Memoria' },
  { href: '/coach', icon: Bot, label: 'Coach IA' },
]

export function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex items-stretch h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const full = `/${locale}${href}`
          const active = pathname.startsWith(full)
          return (
            <Link key={href} href={full} className={cn('flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]', active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
