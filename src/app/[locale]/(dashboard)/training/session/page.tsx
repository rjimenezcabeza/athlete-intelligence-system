'use client'
import { useState } from 'react'
import { SetLogger } from '@/components/training/SetLogger'
import type { SetInput } from '@/types/training.types'

export default function SessionPage() {
  const [sets, setSets] = useState<SetInput[]>([])
  const handleSetLogged = async (set: SetInput) => { setSets(prev => [...prev, set]) }
  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Sesión activa</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Conectará con plantillas en Sprint 2</p>
      </div>
      <SetLogger
        sessionExerciseId="demo"
        exerciseName="Press Banca con Barra"
        dayLabel="Demo Sprint 1"
        loggedSets={sets}
        targetSets={3}
        repRangeMin={8}
        repRangeMax={12}
        rirTarget={2}
        aiSuggestion="Objetivo: 3×8-12 reps con RIR 2. Si llegas a 12 en todos los sets → sube 2.5kg la próxima sesión."
        onSetLogged={handleSetLogged}
      />
    </div>
  )
}
