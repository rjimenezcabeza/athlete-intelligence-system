import { create } from 'zustand'

export interface ActiveSet {
  id?: string
  set_number: number
  set_type: 'warmup' | 'working' | 'top_set' | 'backoff' | 'myorep' | 'rest_pause' | 'failure'
  weight_kg: number | null
  reps_completed: number | null
  rir_actual: number | null
  rpe_actual: number | null
  notes: string | null
  logged_at?: string
}

export interface ActiveExercise {
  id: string
  session_exercise_id?: string
  exercise_id: string
  name: string
  muscle_group_primary: string
  slug: string
  order_in_session: number
  sets: ActiveSet[]
}

export interface ActiveSession {
  id: string
  athlete_id: string
  template_id: string | null
  session_date: string
  started_at: string
  day_number: number | null
  day_label: string | null
}

export interface FeedbackData {
  pump_rating: number | null
  local_fatigue: number | null
  perceived_recovery: number | null
  rir_session_avg: number | null
}

const DEFAULT_FEEDBACK: FeedbackData = {
  pump_rating: null,
  local_fatigue: null,
  perceived_recovery: null,
  rir_session_avg: null,
}

interface SessionState {
  activeSession: ActiveSession | null
  exercises: ActiveExercise[]
  currentExerciseIndex: number
  isLoading: boolean
  error: string | null
  // Feedback post-sesión
  feedbackStep: number
  feedbackData: FeedbackData

  setActiveSession: (session: ActiveSession | null) => void
  setExercises: (exercises: ActiveExercise[]) => void
  addExercise: (exercise: ActiveExercise) => void
  setCurrentExerciseIndex: (index: number) => void
  addSet: (exerciseIndex: number, set: ActiveSet) => void
  updateSet: (exerciseIndex: number, setIndex: number, set: Partial<ActiveSet>) => void
  removeSet: (exerciseIndex: number, setIndex: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearSession: () => void
  // Feedback actions
  setFeedbackStep: (step: number) => void
  setFeedbackField: (field: keyof FeedbackData, value: number) => void
  resetFeedback: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  exercises: [],
  currentExerciseIndex: 0,
  isLoading: false,
  error: null,
  feedbackStep: 0,
  feedbackData: { ...DEFAULT_FEEDBACK },

  setActiveSession: (session) => set({ activeSession: session }),
  setExercises: (exercises) => set({ exercises }),
  addExercise: (exercise) => set((state) => ({
    exercises: [...state.exercises, exercise],
  })),
  setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),

  addSet: (exerciseIndex, newSet) => set((state) => {
    const exercises = [...state.exercises]
    exercises[exerciseIndex] = {
      ...exercises[exerciseIndex],
      sets: [...exercises[exerciseIndex].sets, newSet],
    }
    return { exercises }
  }),

  updateSet: (exerciseIndex, setIndex, updatedSet) => set((state) => {
    const exercises = [...state.exercises]
    const sets = [...exercises[exerciseIndex].sets]
    sets[setIndex] = { ...sets[setIndex], ...updatedSet }
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets }
    return { exercises }
  }),

  removeSet: (exerciseIndex, setIndex) => set((state) => {
    const exercises = [...state.exercises]
    const sets = exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex)
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets }
    return { exercises }
  }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  clearSession: () => set({
    activeSession: null,
    exercises: [],
    currentExerciseIndex: 0,
    isLoading: false,
    error: null,
    feedbackStep: 0,
    feedbackData: { ...DEFAULT_FEEDBACK },
  }),

  setFeedbackStep: (step) => set({ feedbackStep: step }),
  setFeedbackField: (field, value) =>
    set((state) => ({
      feedbackData: { ...state.feedbackData, [field]: value },
    })),
  resetFeedback: () =>
    set({
      feedbackStep: 0,
      feedbackData: { ...DEFAULT_FEEDBACK },
    }),
}))
