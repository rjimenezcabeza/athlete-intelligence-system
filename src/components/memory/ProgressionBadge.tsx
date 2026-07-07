'use client'

interface ProgressionRecommendation {
  exercise_name: string
  action_type: 'weight_increase' | 'rep_increase' | 'deload' | 'maintain' | 'set_increase'
  prev_weight_kg: number | null
  new_weight_kg: number | null
  prev_reps_target: number | null
  new_reps_target: number | null
  reasoning_es: string
  reasoning_en: string
  confidence: 'high' | 'medium' | 'low'
}

interface ProgressionBadgeProps {
  recommendation: ProgressionRecommendation
  language?: string
}

const ACTION_CONFIG = {
  weight_increase: { icon: '📈', color: 'text-[#C8FF00]', label_es: 'Subir peso', label_en: 'Increase weight' },
  rep_increase: { icon: '🔄', color: 'text-blue-400', label_es: 'Subir reps', label_en: 'Increase reps' },
  deload: { icon: '⬇️', color: 'text-orange-400', label_es: 'Deload', label_en: 'Deload' },
  maintain: { icon: '✓', color: 'text-white/60', label_es: 'Mantener', label_en: 'Maintain' },
  set_increase: { icon: '➕', color: 'text-purple-400', label_es: 'Añadir serie', label_en: 'Add set' },
}

export function ProgressionBadge({ recommendation: r, language = 'es' }: ProgressionBadgeProps) {
  const config = ACTION_CONFIG[r.action_type]
  const reasoning = language === 'en' ? r.reasoning_en : r.reasoning_es
  const actionLabel = language === 'en' ? config.label_en : config.label_es

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span>{config.icon}</span>
        <span className={`text-xs font-semibold font-mono uppercase tracking-wide ${config.color}`}>
          {actionLabel}
        </span>
        <span className="text-white/30 text-xs">•</span>
        <span className="text-white/70 text-xs font-semibold truncate">{r.exercise_name}</span>
      </div>
      {r.action_type === 'weight_increase' && r.new_weight_kg && (
        <div className="flex items-center gap-2 my-1">
          <span className="text-white/40 text-sm line-through">{r.prev_weight_kg}kg</span>
          <span className="text-[#C8FF00] font-bold text-sm">→ {r.new_weight_kg}kg</span>
        </div>
      )}
      <p className="text-white/50 text-xs mt-1">{reasoning}</p>
    </div>
  )
}
