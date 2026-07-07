'use client'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const { isOnline } = useOfflineSync()
  if (isOnline) return null
  return (
    <div className={cn('fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500/90 py-1.5 px-3 text-amber-950 text-xs font-medium')}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-900/60 animate-pulse" />
      Sin conexión — guardando localmente
    </div>
  )
}
