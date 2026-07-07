import { describe, it, expect } from 'vitest'
import { doubleProgression } from '@/lib/progression/engine'
import type { ProgressionInput } from '@/lib/progression/engine'

const base: ProgressionInput = {
  methodType: 'double_progression',
  config: { repRangeMin: 8, repRangeMax: 12, sets: 3, weightIncrementKg: 2.5, restSeconds: 120 },
  currentPrescription: { setsTarget: 3, repRangeMin: 8, repRangeMax: 12, currentWeightKg: 100 },
  exerciseHistory: [],
}

describe('Double Progression', () => {
  it('devuelve insufficient_data sin historial', () => {
    expect(doubleProgression(base).recommendation).toBe('insufficient_data')
  })
  it('sugiere increase_weight cuando todos los sets llegan al máximo', () => {
    const input = { ...base, exerciseHistory: [{ sessionDate: '2026-06-01', sets: Array(3).fill({ weightKg: 100, repsCompleted: 12, setType: 'working' as const }) }] }
    const r = doubleProgression(input)
    expect(r.recommendation).toBe('increase_weight')
    expect(r.suggestedWeightKg).toBe(102.5)
    expect(r.readyToProgress).toBe(true)
  })
  it('sugiere increase_reps cuando no se llega al máximo', () => {
    const input = { ...base, exerciseHistory: [{ sessionDate: '2026-06-01', sets: [{ weightKg: 100, repsCompleted: 10, setType: 'working' as const }, { weightKg: 100, repsCompleted: 9, setType: 'working' as const }, { weightKg: 100, repsCompleted: 8, setType: 'working' as const }] }] }
    expect(doubleProgression(input).recommendation).toBe('increase_reps')
  })
  it('sugiere maintain cuando no completa todos los sets', () => {
    const input = { ...base, exerciseHistory: [{ sessionDate: '2026-06-01', sets: [{ weightKg: 100, repsCompleted: 12, setType: 'working' as const }, { weightKg: 100, repsCompleted: 12, setType: 'working' as const }] }] }
    expect(doubleProgression(input).recommendation).toBe('maintain')
  })
  it('no cuenta warmup sets', () => {
    const input = { ...base, exerciseHistory: [{ sessionDate: '2026-06-01', sets: [{ weightKg: 60, repsCompleted: 15, setType: 'warmup' as const }, ...Array(3).fill({ weightKg: 100, repsCompleted: 12, setType: 'working' as const })] }] }
    expect(doubleProgression(input).recommendation).toBe('increase_weight')
  })
  it('calcula el incremento correcto', () => {
    const input = { ...base, config: { ...base.config, weightIncrementKg: 5 }, exerciseHistory: [{ sessionDate: '2026-06-01', sets: Array(3).fill({ weightKg: 100, repsCompleted: 12, setType: 'working' as const }) }] }
    expect(doubleProgression(input).suggestedWeightKg).toBe(105)
  })
})
