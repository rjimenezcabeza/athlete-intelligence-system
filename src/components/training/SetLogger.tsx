'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useWakeLock } from '@/hooks/useWakeLock'
import { savePendingSet } from '@/lib/offline/db'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import type { SetInput, SetType } from '@/types/training.types'

interface PreviousSet { weightKg: number; repsCompleted: number; rirActual?: number }

interface SetLoggerProps {
  sessionExerciseId: string; exerciseName: string; dayLabel?: string
  loggedSets: SetInput[]; targetSets: number
  repRangeMin: number; repRangeMax: number; rirTarget?: number
  lastSessionSets?: PreviousSet[]; aiSuggestion?: string
  onSetLogged: (set: SetInput) => Promise<void>
  onSessionExerciseDone?: () => void
}

export function SetLogger({ sessionExerciseId, exerciseName, dayLabel, loggedSets, targetSets, repRangeMin, repRangeMax, rirTarget, lastSessionSets, aiSuggestion, onSetLogged, onSessionExerciseDone }: SetLoggerProps) {
  const currentSetNum = loggedSets.length + 1
  const isDone = loggedSets.length >= targetSets
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRir] = useState(rirTarget?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const weightRef = useRef<HTMLInputElement>(null)
  const repsRef = useRef<HTMLInputElement>(null)
  const rirRef = useRef<HTMLInputElement>(null)

  useWakeLock()

  useEffect(() => {
    if (isDone) return
    const prev = loggedSets.length > 0
      ? loggedSets[loggedSets.length - 1].weightKg.toString()
      : lastSessionSets?.length
      ? lastSessionSets[lastSessionSets.length - 1].weightKg.toString()
      : ''
    setWeight(prev); setReps(''); setRir(rirTarget?.toString() ?? '')
    setTimeout(() => { weightRef.current?.focus(); weightRef.current?.select() }, 50)
  }, [currentSetNum, isDone])

  const handleLog = useCallback(async () => {
    const w = parseFloat(weight), r = parseInt(reps)
    if (!w || !r || saving) return
    setSaving(true)
    const setData: SetInput = { setNumber: currentSetNum, setType: 'working' as SetType, weightKg: w, repsCompleted: r, rirActual: rir ? parseInt(rir) : undefined }
    await savePendingSet({ tempId: nanoid(), sessionExerciseId, setData, timestamp: Date.now(), synced: false })
    await onSetLogged(setData)
    if (navigator.vibrate) navigator.vibrate(50)
    setJustSaved(true); setTimeout(() => setJustSaved(false), 700)
    setSaving(false)
  }, [weight, reps, rir, currentSetNum, sessionExerciseId, onSetLogged, saving])

  const onWKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); repsRef.current?.focus(); repsRef.current?.select() } }
  const onRKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); rirTarget !== undefined ? (rirRef.current?.focus(), rirRef.current?.select()) : handleLog() } }
  const onRirKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); handleLog() } }

  return (
    <div className="flex flex-col gap-4 select-none">
      <div>
        {dayLabel && <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">{dayLabel}</p>}
        <h2 className="text-lg font-semibold leading-tight">{exerciseName}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{targetSets} sets · {repRangeMin}–{repRangeMax} reps{rirTarget !== undefined ? ` · RIR ${rirTarget}` : ''}</p>
      </div>
      {aiSuggestion && (
        <div className="rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] font-medium text-primary/60 uppercase tracking-wider mb-0.5">Coach IA</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{aiSuggestion}</p>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-[28px_1fr_1fr_1fr] gap-2 px-1">
          {['#','KG','REPS','RIR'].map(h => <span key={h} className="text-[10px] font-medium text-muted-foreground/60 text-center uppercase tracking-widest">{h}</span>)}
        </div>
        {loggedSets.map((s, i) => (
          <div key={i} className="grid grid-cols-[28px_1fr_1fr_1fr] gap-2 rounded-lg bg-muted/20 px-1 py-2">
            <span className="text-center text-sm text-muted-foreground/50">{i + 1}</span>
            <span className="text-center text-sm font-medium text-foreground/70">{s.weightKg}</span>
            <span className="text-center text-sm font-medium text-foreground/70">{s.repsCompleted}</span>
            <span className="text-center text-sm font-medium text-foreground/70">{s.rirActual ?? '—'}</span>
          </div>
        ))}
        {!isDone && (
          <div className="grid grid-cols-[28px_1fr_1fr_1fr] gap-2 rounded-xl border border-primary/30 bg-primary/5 px-1 py-2">
            <span className="text-center text-sm font-bold text-primary">{currentSetNum}</span>
            <input ref={weightRef} type="number" inputMode="decimal" step="0.5" min="0" value={weight} onChange={e => setWeight(e.target.value)} onKeyDown={onWKey} onFocus={e => e.target.select()} placeholder="—" className="h-11 w-full rounded-lg border border-primary/40 bg-background text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/30" />
            <input ref={repsRef} type="number" inputMode="numeric" min="0" value={reps} onChange={e => setReps(e.target.value)} onKeyDown={onRKey} onFocus={e => e.target.select()} placeholder="—" className="h-11 w-full rounded-lg border border-border/60 bg-background text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/30" />
            <input ref={rirRef} type="number" inputMode="numeric" min="0" max="5" value={rir} onChange={e => setRir(e.target.value)} onKeyDown={onRirKey} onFocus={e => e.target.select()} placeholder="—" className="h-11 w-full rounded-lg border border-border/60 bg-background text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/30" />
          </div>
        )}
      </div>
      {lastSessionSets && lastSessionSets.length > 0 && (
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest shrink-0">Última</span>
          <div className="flex gap-1.5 flex-wrap">
            {lastSessionSets.map((s, i) => <span key={i} className="text-[11px] text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">{s.weightKg}×{s.repsCompleted}{s.rirActual !== undefined ? `@${s.rirActual}` : ''}</span>)}
          </div>
        </div>
      )}
      {!isDone ? (
        <button onClick={handleLog} disabled={saving || !weight || !reps} className={cn('h-14 w-full rounded-2xl text-base font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed', justSaved ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground')}>
          {justSaved ? '✓ Guardado' : saving ? 'Guardando...' : `Guardar set ${currentSetNum}`}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-center">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✓ {targetSets} sets completados</p>
          </div>
          {onSessionExerciseDone && <button onClick={onSessionExerciseDone} className="h-12 w-full rounded-xl border border-border bg-background text-sm font-medium hover:bg-muted/50 transition-colors">Siguiente ejercicio →</button>}
        </div>
      )}
    </div>
  )
}
