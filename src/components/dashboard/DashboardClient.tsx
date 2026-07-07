'use client'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { ChevronRight, Flame, Trophy, Dumbbell, TrendingUp } from 'lucide-react'
import { StartSessionButton } from '@/components/training/StartSessionButton'

interface Props {
  displayName: string
  nextTemplate: { id: string; name: string } | null
}

export function DashboardClient({ displayName, nextTemplate }: Props) {
  const locale = useLocale()
  const { stats, loading } = useDashboardStats()

  const formatVolume = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
    return `${kg}kg`
  }

  const metricCards = [
    {
      icon: Dumbbell,
      label: 'Sesiones esta semana',
      value: loading ? '—' : String(stats?.weekSessions ?? 0),
      color: 'text-blue-500',
    },
    {
      icon: TrendingUp,
      label: 'Volumen semanal',
      value: loading ? '—' : formatVolume(stats?.weekVolume ?? 0),
      color: 'text-emerald-500',
    },
    {
      icon: Flame,
      label: 'Racha actual',
      value: loading ? '—' : `${stats?.streak ?? 0}d`,
      color: 'text-orange-500',
    },
    {
      icon: Trophy,
      label: 'PRs este mes',
      value: loading ? '—' : String(stats?.monthPRs ?? 0),
      color: 'text-yellow-500',
    },
  ]

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-xl font-semibold">Hola, {displayName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="px-0 py-2">
        <StartSessionButton label="⚡ Iniciar Entrenamiento" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metricCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {nextTemplate ? (
        <Link
          href={`/${locale}/training/session?templateId=${nextTemplate.id}`}
          className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 active:bg-muted/50 transition-colors"
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Próxima sesión</p>
            <p className="text-sm font-medium">{nextTemplate.name}</p>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-medium">
            Entrenar <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      ) : (
        <Link
          href={`/${locale}/training/templates`}
          className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4"
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Para empezar</p>
            <p className="text-sm font-medium">Crea tu primera plantilla</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      {!loading && (stats?.recentPRs?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            🏆 PRs recientes
          </p>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {stats!.recentPRs.slice(0, 3).map((pr: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-yellow-500/5 border border-yellow-500/20 px-3 py-2.5">
                <p className="text-sm font-medium">
                  {pr.session_exercise?.exercise?.name ?? 'Ejercicio'}
                </p>
                <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                  {pr.weight_kg}kg × {pr.reps_completed}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
