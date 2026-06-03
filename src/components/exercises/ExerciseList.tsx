'use client'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Exercise { id: string; name: string; muscle_group_primary: string; muscle_groups_secondary: string[]; equipment: string | null; difficulty_level: number; is_bilateral: boolean }

const GROUPS = ['Todos','pecho','espalda','deltoides lateral','deltoides anterior','biceps','triceps','cuadriceps','isquiotibiales','gluteos','gemelos','core']

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('Todos')

  const filtered = useMemo(() => exercises.filter(ex =>
    (group === 'Todos' || ex.muscle_group_primary === group) &&
    (!search || ex.name.toLowerCase().includes(search.toLowerCase()))
  ), [exercises, search, group])

  const grouped = useMemo(() => filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle_group_primary]) acc[ex.muscle_group_primary] = []
    acc[ex.muscle_group_primary].push(ex)
    return acc
  }, {}), [filtered])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar ejercicios..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {GROUPS.map(g => (
          <button key={g} onClick={() => setGroup(g)} className={cn('shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors capitalize', group === g ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-muted-foreground hover:border-border')}>
            {g}
          </button>
        ))}
      </div>
      {Object.entries(grouped).map(([g, exs]) => (
        <div key={g}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{g} ({exs.length})</p>
          <div className="space-y-2">
            {exs.map(ex => (
              <div key={ex.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3">
                <div>
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ex.equipment ?? 'Sin equipo'} · {ex.is_bilateral ? 'Bilateral' : 'Unilateral'}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{'★'.repeat(ex.difficulty_level)}</Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!filtered.length && <p className="text-center text-muted-foreground text-sm py-8">No se encontraron ejercicios</p>}
    </div>
  )
}
