'use client'

interface ExerciseHistoryData {
  id: string
  exercise_id: string
  exercises: {
    name: string
    slug: string
    muscle_group_primary: string
    equipment: string | null
  }
  total_sessions: number
  total_sets: number
  best_weight_kg: number | null
  best_1rm_estimated: number | null
  avg_weight_last4w: number | null
  avg_rir_last4w: number | null
  weight_trend: number | null
  last_logged_at: string | null
}

interface ExerciseHistoryCardProps {
  history: ExerciseHistoryData
  language?: string
}

export function ExerciseHistoryCard({ history: h, language = 'es' }: ExerciseHistoryCardProps) {
  const trendSymbol = h.weight_trend === null ? '—' : h.weight_trend > 0.1 ? '↑' : h.weight_trend < -0.1 ? '↓' : '→'
  const trendColor = h.weight_trend === null ? 'text-white/30' : h.weight_trend > 0.1 ? 'text-[#C8FF00]' : h.weight_trend < -0.1 ? 'text-red-400' : 'text-white/50'

  const lastLogged = h.last_logged_at
    ? new Date(h.last_logged_at).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short' })
    : '—'

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-white text-sm">{h.exercises.name}</h4>
          <span className="text-white/40 text-xs font-mono">{h.exercises.muscle_group_primary}</span>
        </div>
        <span className={`text-lg font-bold ${trendColor}`}>{trendSymbol}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[#C8FF00] font-bold text-lg">
            {h.best_weight_kg ? `${h.best_weight_kg}kg` : '—'}
          </p>
          <p className="text-white/40 text-xs">{language === 'en' ? 'Best' : 'Mejor'}</p>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg">{h.total_sessions}</p>
          <p className="text-white/40 text-xs">{language === 'en' ? 'Sessions' : 'Sesiones'}</p>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg">
            {h.avg_rir_last4w !== null ? h.avg_rir_last4w.toFixed(1) : '—'}
          </p>
          <p className="text-white/40 text-xs">RIR avg</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-white/30 text-xs">
          {language === 'en' ? 'Last: ' : 'Última: '}{lastLogged}
        </span>
        {h.best_1rm_estimated && (
          <span className="text-white/40 text-xs font-mono">
            1RM est. {h.best_1rm_estimated.toFixed(1)}kg
          </span>
        )}
      </div>
    </div>
  )
}
