'use client'
import { useState } from 'react'
import { formatDate, formatDuration, calculateVolume } from '@/lib/utils/training'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'

interface Set { weight_kg: number | null; reps_completed: number | null; set_type: string; is_personal_record: boolean }
interface SessionExercise { exercise: { name: string; muscle_group_primary: string }; sets: Set[] }
interface Session { id: string; session_date: string; day_label: string | null; duration_minutes: number | null; session_exercises: SessionExercise[] }

export function HistoryClient({ sessions, weightUnit }: { sessions: Session[]; weightUnit: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!sessions.length) {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm font-medium">Sin sesiones aún</p>
        <p className="text-xs text-muted-foreground text-center">Completa tu primera sesión de entrenamiento para ver tu historial aquí.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-semibold">Historial</h1>
      {sessions.map(s => {
        const isOpen = expanded === s.id
        const workingSets = s.session_exercises.flatMap(ex => ex.sets.filter(set => set.set_type === 'working'))
        const totalVolume = workingSets.reduce((sum, set) =>
          sum + calculateVolume(set.weight_kg ?? 0, set.reps_completed ?? 0), 0
        )
        const hasPR = s.session_exercises.some(ex => ex.sets.some(set => set.is_personal_record))
        const muscleGroups = [...new Set(s.session_exercises.map(ex => ex.exercise?.muscle_group_primary).filter(Boolean))]

        return (
          <div key={s.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <button
              className="w-full text-left p-4"
              onClick={() => setExpanded(isOpen ? null : s.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{s.day_label ?? 'Sesión'}</p>
                    {hasPR && <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(s.session_date)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {s.duration_minutes && (
                      <p className="text-xs text-muted-foreground">{formatDuration(s.duration_minutes)}</p>
                    )}
                    {totalVolume > 0 && (
                      <p className="text-xs font-medium">{(totalVolume / 1000).toFixed(1)}t</p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              {muscleGroups.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {muscleGroups.slice(0, 4).map(g => (
                    <span key={g} className="text-[10px] bg-muted/50 rounded-md px-2 py-0.5 text-muted-foreground capitalize">{g}</span>
                  ))}
                </div>
              )}
            </button>

            {isOpen && (
              <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-3">
                {s.session_exercises.map((ex, i) => {
                  const working = ex.sets.filter(set => set.set_type === 'working')
                  if (!working.length) return null
                  return (
                    <div key={i}>
                      <p className="text-xs font-medium mb-1.5">{ex.exercise?.name}</p>
                      <div className="space-y-1">
                        {working.map((set, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="w-4 text-center">{j + 1}</span>
                            <span className="font-medium text-foreground">{set.weight_kg}{weightUnit}</span>
                            <span>×</span>
                            <span>{set.reps_completed} reps</span>
                            {set.is_personal_record && (
                              <span className="text-yellow-500 font-medium">PR 🏆</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
