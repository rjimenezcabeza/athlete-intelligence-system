'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Exercise {
  id: string
  name: string
  muscle_group_primary?: string
}

interface Props {
  onSelect: (exercise: Exercise) => void
}

export function QuickExerciseSelector({ onSelect }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadExercises()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadExercises = async () => {
    const { data } = await (supabase as any)
      .from('exercises')
      .select('id, name, muscle_group_primary')
      .order('name')
    setExercises(data ?? [])
    setLoading(false)
  }

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-3 p-4">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar ejercicio..."
        autoFocus
        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C8FF00] font-mono"
      />
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all"
            >
              <span className="text-white font-medium">{ex.name}</span>
              {ex.muscle_group_primary && (
                <span className="text-xs text-white/30 font-mono uppercase">
                  {ex.muscle_group_primary}
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-white/30 text-center py-4 font-mono text-sm">
              No se encontró &quot;{search}&quot;
            </p>
          )}
        </div>
      )}
    </div>
  )
}
