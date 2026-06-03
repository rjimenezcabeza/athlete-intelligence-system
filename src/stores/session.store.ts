import { create } from 'zustand'
import type { SetInput } from '@/types/training.types'

interface ActiveExercise {
  sessionExerciseId: string
  exerciseId: string
  exerciseName: string
  dayLabel?: string
  orderInSession: number
  setsTarget: number
  repRangeMin: number
  repRangeMax: number
  rirTarget?: number
  loggedSets: SetInput[]
  lastSessionSets?: SetInput[]
  aiSuggestion?: string
  progressionRecommendation?: string
}

interface SessionState {
  sessionId: string | null
  templateId: string | null
  sessionDate: string
  exercises: ActiveExercise[]
  currentExerciseIndex: number
  isActive: boolean
  startedAt: string | null

  startSession: (sessionId: string, templateId: string | null, exercises: ActiveExercise[]) => void
  logSet: (exerciseIndex: number, set: SetInput) => void
  nextExercise: () => void
  endSession: () => void
  setAiSuggestion: (exerciseIndex: number, suggestion: string) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  templateId: null,
  sessionDate: new Date().toISOString().split('T')[0],
  exercises: [],
  currentExerciseIndex: 0,
  isActive: false,
  startedAt: null,

  startSession: (sessionId, templateId, exercises) =>
    set({ sessionId, templateId, exercises, currentExerciseIndex: 0, isActive: true, startedAt: new Date().toISOString() }),

  logSet: (exerciseIndex, newSet) =>
    set(state => {
      const exercises = [...state.exercises]
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        loggedSets: [...exercises[exerciseIndex].loggedSets, newSet],
      }
      return { exercises }
    }),

  nextExercise: () =>
    set(state => ({
      currentExerciseIndex: Math.min(state.currentExerciseIndex + 1, state.exercises.length - 1),
    })),

  endSession: () =>
    set({ isActive: false, sessionId: null, exercises: [], currentExerciseIndex: 0 }),

  setAiSuggestion: (exerciseIndex, suggestion) =>
    set(state => {
      const exercises = [...state.exercises]
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], aiSuggestion: suggestion }
      return { exercises }
    }),
}))
