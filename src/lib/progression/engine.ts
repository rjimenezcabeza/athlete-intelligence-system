import type { SetType, ProgressionConfig, ProgressionMethodType } from '@/types/training.types'

export interface SetHistory {
  sessionDate: string
  sets: { weightKg: number; repsCompleted: number; rirActual?: number; setType: SetType }[]
}

export interface ProgressionInput {
  methodType: ProgressionMethodType
  config: ProgressionConfig
  exerciseHistory: SetHistory[]
  currentPrescription: {
    setsTarget: number; repRangeMin: number; repRangeMax: number
    rirTarget?: number; currentWeightKg: number
  }
}

export interface ProgressionOutput {
  recommendation: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload' | 'insufficient_data'
  suggestedWeightKg: number
  suggestedReps: { min: number; max: number }
  suggestedRIR?: number
  confidence: number
  reasoning: string
  readyToProgress: boolean
}

export function calculateProgression(input: ProgressionInput): ProgressionOutput {
  switch (input.methodType) {
    case 'double_progression': return doubleProgression(input)
    case 'double_progression_rir': return doubleProgressionRIR(input)
    case 'top_set_backoff': return topSetBackoff(input)
    default: return doubleProgression(input)
  }
}

export function doubleProgression(input: ProgressionInput): ProgressionOutput {
  const { currentPrescription: p, exerciseHistory, config } = input
  if (!exerciseHistory.length) return {
    recommendation: 'insufficient_data', suggestedWeightKg: p.currentWeightKg,
    suggestedReps: { min: p.repRangeMin, max: p.repRangeMax },
    confidence: 0, reasoning: 'Sin historial. Completa una sesión primero.', readyToProgress: false,
  }
  const working = exerciseHistory[0].sets.filter(s => s.setType === 'working')
  if (!working.length) return {
    recommendation: 'insufficient_data', suggestedWeightKg: p.currentWeightKg,
    suggestedReps: { min: p.repRangeMin, max: p.repRangeMax },
    confidence: 0.3, reasoning: 'Sin working sets en última sesión.', readyToProgress: false,
  }
  const allDone = working.length >= p.setsTarget
  const allMax = working.every(s => s.repsCompleted >= p.repRangeMax)
  if (allDone && allMax) {
    const inc = config.weightIncrementKg ?? 2.5
    const nw = parseFloat((p.currentWeightKg + inc).toFixed(2))
    return { recommendation: 'increase_weight', suggestedWeightKg: nw, suggestedReps: { min: p.repRangeMin, max: p.repRangeMax }, confidence: 0.95, reasoning: `${p.repRangeMax} reps en todos los sets ✓ → Sube a ${nw}kg la próxima sesión.`, readyToProgress: true }
  }
  if (allDone) {
    const avg = (working.reduce((s, x) => s + x.repsCompleted, 0) / working.length).toFixed(1)
    return { recommendation: 'increase_reps', suggestedWeightKg: p.currentWeightKg, suggestedReps: { min: p.repRangeMin, max: p.repRangeMax }, confidence: 0.85, reasoning: `Media ${avg} reps (objetivo: ${p.repRangeMax}). Sigue subiendo reps antes de subir peso.`, readyToProgress: false }
  }
  return { recommendation: 'maintain', suggestedWeightKg: p.currentWeightKg, suggestedReps: { min: p.repRangeMin, max: p.repRangeMax }, confidence: 0.7, reasoning: `${working.length}/${p.setsTarget} sets completados. Completa todos los sets primero.`, readyToProgress: false }
}

export function doubleProgressionRIR(input: ProgressionInput): ProgressionOutput {
  const { currentPrescription: p, exerciseHistory, config } = input
  if (!exerciseHistory.length) return { ...doubleProgression(input), suggestedRIR: p.rirTarget }
  const working = exerciseHistory[0].sets.filter(s => s.setType === 'working')
  const allDone = working.length >= p.setsTarget
  const allMax = working.every(s => s.repsCompleted >= p.repRangeMax)
  const rirArr = working.filter(s => s.rirActual !== undefined)
  const avgRIR = rirArr.length ? rirArr.reduce((s, x) => s + x.rirActual!, 0) / rirArr.length : 999
  const threshold = config.rirThreshold ?? 1
  if (allDone && allMax && avgRIR <= threshold) {
    const inc = config.weightIncrementKg ?? 2.5
    const nw = parseFloat((p.currentWeightKg + inc).toFixed(2))
    return { recommendation: 'increase_weight', suggestedWeightKg: nw, suggestedReps: { min: p.repRangeMin, max: p.repRangeMax }, suggestedRIR: p.rirTarget, confidence: 0.95, reasoning: `${p.repRangeMax} reps con RIR ${avgRIR.toFixed(1)} ≤ ${threshold} ✓ → Sube a ${nw}kg.`, readyToProgress: true }
  }
  return { ...doubleProgression(input), suggestedRIR: p.rirTarget }
}

export function topSetBackoff(input: ProgressionInput): ProgressionOutput {
  const { currentPrescription: p, exerciseHistory, config } = input
  if (!exerciseHistory.length) return doubleProgression(input)
  const topSet = exerciseHistory[0].sets.find(s => s.setType === 'top_set')
  if (!topSet) return doubleProgression(input)
  if (topSet.repsCompleted >= p.repRangeMax) {
    const inc = config.weightIncrementKg ?? 2.5
    const nTop = parseFloat((topSet.weightKg + inc).toFixed(2))
    const backoff = parseFloat((nTop * (config.backoffPercent ?? 0.85)).toFixed(2))
    return { recommendation: 'increase_weight', suggestedWeightKg: nTop, suggestedReps: { min: p.repRangeMin, max: p.repRangeMax }, confidence: 0.9, reasoning: `Top set completado → Nuevo top: ${nTop}kg · Back-off: ${backoff}kg.`, readyToProgress: true }
  }
  return { recommendation: 'maintain', suggestedWeightKg: p.currentWeightKg, suggestedReps: { min: p.repRangeMin, max: p.repRangeMax }, confidence: 0.85, reasoning: `Top set: ${topSet.repsCompleted}/${p.repRangeMax} reps. Mantén ${p.currentWeightKg}kg.`, readyToProgress: false }
}
