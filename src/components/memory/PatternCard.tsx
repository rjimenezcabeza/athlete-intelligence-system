'use client'

import { useState } from 'react'

interface Pattern {
  id: string
  pattern_type: string
  title_es: string
  title_en: string
  description_es: string
  description_en: string
  severity: 'info' | 'warning' | 'success' | 'critical'
  exercises?: { name: string; slug: string } | null
}

interface PatternCardProps {
  pattern: Pattern
  language?: string
  onDismiss?: (id: string) => void
}

const SEVERITY_STYLES = {
  info: 'border-blue-500/30 bg-blue-500/5',
  warning: 'border-yellow-500/30 bg-yellow-500/5',
  success: 'border-[#C8FF00]/30 bg-[#C8FF00]/5',
  critical: 'border-red-500/30 bg-red-500/5',
}

const SEVERITY_ICONS = {
  info: '💡',
  warning: '⚠️',
  success: '🔥',
  critical: '🚨',
}

export function PatternCard({ pattern, language = 'es', onDismiss }: PatternCardProps) {
  const [dismissed, setDismissed] = useState(false)

  const title = language === 'en' ? pattern.title_en : pattern.title_es
  const description = language === 'en' ? pattern.description_en : pattern.description_es

  const handleDismiss = async () => {
    setDismissed(true)
    try {
      await fetch('/api/memory/patterns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern_id: pattern.id })
      })
      onDismiss?.(pattern.id)
    } catch (e) {
      setDismissed(false)
    }
  }

  if (dismissed) return null

  return (
    <div className={`rounded-xl border p-4 ${SEVERITY_STYLES[pattern.severity]} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 mt-0.5">
            {SEVERITY_ICONS[pattern.severity]}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">
              {title}
            </p>
            <p className="text-white/60 text-xs mt-1 leading-relaxed">
              {description}
            </p>
            {pattern.exercises && (
              <span className="inline-block mt-2 text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                {pattern.exercises.name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
