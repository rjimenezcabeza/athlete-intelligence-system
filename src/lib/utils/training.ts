export function calculateVolume(weightKg: number, reps: number): number {
  return Math.round(weightKg * reps)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function formatDate(dateStr: string, locale = 'es-ES'): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function getWeekStart(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getMuscleGroupEmoji(group: string): string {
  const map: Record<string, string> = {
    pecho: '💪', espalda: '🔙', cuadriceps: '🦵',
    gluteos: '🍑', isquiotibiales: '🦵', biceps: '💪',
    triceps: '💪', 'deltoides anterior': '🏋️',
    'deltoides lateral': '🏋️', 'deltoides posterior': '🏋️',
    gemelos: '🦵', soleo: '🦵', core: '🎯', braquial: '💪',
  }
  return map[group] ?? '🏋️'
}
