'use client'

import { useState, useEffect, useRef } from 'react'

interface SetLoggerProps {
  exerciseId: string
  exerciseName: string
  setNumber: number
  previousWeight?: number
  previousReps?: number
  onSetLogged: (data: SetData) => void
  onSkip?: () => void
}

export interface SetData {
  exerciseId: string
  setNumber: number
  weightKg: number
  reps: number
  rir?: number
  isWarmup: boolean
  timestamp: Date
}

export function SetLogger({
  exerciseId,
  exerciseName,
  setNumber,
  previousWeight,
  previousReps,
  onSetLogged,
  onSkip,
}: SetLoggerProps) {
  const [weight, setWeight] = useState<string>(previousWeight?.toString() ?? '')
  const [reps, setReps] = useState<string>(previousReps?.toString() ?? '')
  const [rir, setRir] = useState<string>('')
  const [isWarmup, setIsWarmup] = useState(false)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [showPump, setShowPump] = useState(false)
  const [pumpRating, setPumpRating] = useState<number | null>(null)
  const weightRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    weightRef.current?.focus()
    weightRef.current?.select()
  }, [])

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return
    const interval = setInterval(() => {
      setRestTimer((t) => (t !== null && t > 0 ? t - 1 : null))
    }, 1000)
    return () => clearInterval(interval)
  }, [restTimer])

  const handleLog = () => {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return

    onSetLogged({
      exerciseId,
      setNumber,
      weightKg: w,
      reps: r,
      rir: rir ? parseInt(rir) : undefined,
      isWarmup,
      timestamp: new Date(),
    })

    setRestTimer(90)

    if (setNumber >= 2) setShowPump(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent, nextField?: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextField ? nextField() : handleLog()
    }
  }

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-[#111118] border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-mono">
            Serie {setNumber}
          </p>
          <h3 className="text-white font-semibold text-lg leading-tight">{exerciseName}</h3>
        </div>
        {isWarmup && (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-mono">
            CALENTAMIENTO
          </span>
        )}
      </div>

      {/* Previous performance reference */}
      {previousWeight && previousReps && (
        <div className="flex gap-2 text-xs text-white/30 font-mono">
          <span>Anterior:</span>
          <span className="text-white/50">{previousWeight}kg × {previousReps}</span>
        </div>
      )}

      {/* Main inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40 font-mono uppercase tracking-widest">
            Peso (kg)
          </label>
          <input
            ref={weightRef}
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('reps-input')?.focus())}
            placeholder={previousWeight?.toString() ?? '0'}
            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-2xl font-mono text-center focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/40 font-mono uppercase tracking-widest">
            Reps
          </label>
          <input
            id="reps-input"
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
            placeholder={previousReps?.toString() ?? '0'}
            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-2xl font-mono text-center focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00] transition-all"
          />
        </div>
      </div>

      {/* RIR selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-white/40 font-mono uppercase tracking-widest whitespace-nowrap">
          RIR
        </label>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((v) => (
            <button
              key={v}
              onClick={() => setRir(rir === v.toString() ? '' : v.toString())}
              className={`w-9 h-9 rounded-lg text-sm font-mono transition-all ${
                rir === v.toString()
                  ? 'bg-[#C8FF00] text-black font-bold'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Warmup toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsWarmup(!isWarmup)}
          className={`flex items-center gap-2 text-sm font-mono transition-all ${
            isWarmup ? 'text-yellow-400' : 'text-white/30'
          }`}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
            isWarmup ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/30'
          }`}>
            {isWarmup && <div className="w-2 h-2 rounded-sm bg-yellow-400" />}
          </div>
          Serie de calentamiento
        </button>
      </div>

      {/* Log button */}
      <button
        onClick={handleLog}
        disabled={!weight || !reps}
        className="w-full py-4 rounded-2xl bg-[#C8FF00] text-black font-bold text-lg tracking-tight transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
      >
        ✓ Registrar Serie
      </button>

      {/* Rest timer */}
      {restTimer !== null && restTimer > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Descanso</span>
          <span className={`text-2xl font-mono font-bold transition-colors ${
            restTimer <= 10 ? 'text-red-400' : restTimer <= 30 ? 'text-yellow-400' : 'text-[#C8FF00]'
          }`}>
            {formatTimer(restTimer)}
          </span>
          <button
            onClick={() => setRestTimer(null)}
            className="text-xs text-white/30 hover:text-white/60 font-mono"
          >
            SALTAR
          </button>
        </div>
      )}

      {/* Pump rating (after set 2+) */}
      {showPump && (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
            Pump / Congestión
          </p>
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setPumpRating(pumpRating === v ? null : v)}
                className={`flex-1 py-2 rounded-lg text-sm font-mono transition-all ${
                  pumpRating === v
                    ? 'bg-[#C8FF00] text-black font-bold'
                    : 'bg-white/10 text-white/40 hover:bg-white/20'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-white/20 font-mono px-1">
            <span>Sin pump</span>
            <span>Máximo</span>
          </div>
        </div>
      )}

      {/* Skip option */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="text-xs text-white/20 hover:text-white/40 font-mono text-center transition-all"
        >
          Saltar ejercicio
        </button>
      )}
    </div>
  )
}
