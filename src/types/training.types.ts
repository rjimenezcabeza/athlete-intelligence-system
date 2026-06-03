export type WeightUnit = 'kg' | 'lbs'
export type SubscriptionTier = 'free' | 'pro' | 'coach' | 'admin'
export type SetType = 'warmup' | 'working' | 'top_set' | 'backoff' | 'myorep' | 'rest_pause' | 'failure'
export type ProgressionMethodType = 'double_progression' | 'double_progression_rir' | 'top_set_backoff' | 'rp_hypertrophy' | 'jordan_peters' | 'doggcrapp' | 'custom'
export type SessionSource = 'manual' | 'imported' | 'ai_generated'
export type AIRecommendationType = 'pre_workout' | 'progression' | 'deload' | 'fatigue_warning' | 'form_alert' | 'import_review' | 'custom'
export type UserAction = 'accepted' | 'rejected' | 'modified' | 'ignored' | 'pending'

export interface AthleteProfile {
  id: string; userId: string; displayName: string; avatarUrl?: string
  bodyWeightKg?: number; heightCm?: number; weightUnit: WeightUnit
  language: string; timezone: string; subscriptionTier: SubscriptionTier
  subscriptionExpiresAt?: string; trainingExperienceYears?: number
  primaryGoal?: string; createdAt: string; updatedAt: string
}

export interface Exercise {
  id: string; name: string; slug: string; muscleGroupPrimary: string
  muscleGroupsSecondary: string[]; equipment?: string; movementPattern?: string
  isBilateral: boolean; difficultyLevel: number; description?: string
  cues: string[]; isGlobal: boolean; createdBy?: string
}

export interface ProgressionConfig {
  repRangeMin: number; repRangeMax: number; sets: number
  weightIncrementKg: number; restSeconds: number
  rirTarget?: number; rirThreshold?: number
  topSetRpe?: number; backoffPercent?: number
}

export interface TrainingTemplate {
  id: string; athleteId: string; name: string; description?: string
  trainingDaysPerWeek: number; splitType?: string; mesocycleWeeks: number
  defaultProgressionMethodId?: string; isActive: boolean
  isArchived: boolean; createdAt: string; updatedAt: string
}

export interface TemplateExercise {
  id: string; templateId: string; exerciseId: string
  progressionMethodId?: string; dayNumber: number; dayLabel?: string
  orderInDay: number; setsTarget: number; repRangeMin?: number
  repRangeMax?: number; rirTarget?: number; restSeconds: number
  tempo?: string; notes?: string; exercise?: Exercise
}

export interface TrainingSession {
  id: string; athleteId: string; templateId?: string
  sessionDate: string; dayNumber?: number; dayLabel?: string
  startedAt?: string; endedAt?: string; durationMinutes?: number
  readinessScore?: number; sleepQuality?: number; stressLevel?: number
  performanceRating?: number; notes?: string; bodyWeightKg?: number
  source: SessionSource; createdAt: string
}

export interface SessionExercise {
  id: string; sessionId: string; exerciseId: string
  templateExerciseId?: string; orderInSession: number
  exercise?: Exercise; sets?: Set[]
}

export interface Set {
  id: string; sessionExerciseId: string; setNumber: number
  setType: SetType; weightKg?: number; repsCompleted?: number
  rirActual?: number; rpeActual?: number; durationSeconds?: number
  isPersonalRecord: boolean; notes?: string; loggedAt: string
}

export interface SetInput {
  setNumber: number; setType: SetType; weightKg: number
  repsCompleted: number; rirActual?: number; notes?: string
}

export interface AIRecommendation {
  id: string; athleteId: string; sessionId?: string
  templateExerciseId?: string; recommendationType: AIRecommendationType
  recommendationText: string; reasoning?: string
  contextData?: Record<string, unknown>; userAction?: UserAction
  userNotes?: string; aiModel?: string; aiProvider?: string; createdAt: string
}
