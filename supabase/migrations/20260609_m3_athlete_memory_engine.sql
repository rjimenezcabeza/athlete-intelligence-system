-- M3: Athlete Memory Engine
-- Tablas para patrones, insights y contexto histórico del atleta

-- 1. exercise_history: métricas agregadas por ejercicio
CREATE TABLE IF NOT EXISTS public.exercise_history (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id            UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  exercise_id           UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,

  -- Volumen y carga
  total_sessions        INTEGER NOT NULL DEFAULT 0,
  total_sets            INTEGER NOT NULL DEFAULT 0,
  total_reps            INTEGER NOT NULL DEFAULT 0,
  total_volume_kg       NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Records personales
  best_weight_kg        NUMERIC(8,2),
  best_reps_at_weight   INTEGER,
  best_1rm_estimated    NUMERIC(8,2),  -- Epley: weight * (1 + reps/30)
  pr_set_id             UUID REFERENCES public.sets(id),
  pr_achieved_at        TIMESTAMPTZ,

  -- Tendencias recientes (últimas 4 semanas)
  avg_weight_last4w     NUMERIC(8,2),
  avg_reps_last4w       NUMERIC(6,2),
  avg_rir_last4w        NUMERIC(4,2),
  avg_sets_per_session  NUMERIC(4,2),

  -- Progresión
  weight_trend          NUMERIC(6,3),  -- kg/semana (positivo = subiendo)
  volume_trend          NUMERIC(8,3),  -- volumen/semana

  -- Timestamps
  first_logged_at       TIMESTAMPTZ,
  last_logged_at        TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_exercise_history_athlete_exercise
  ON public.exercise_history(athlete_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_history_athlete
  ON public.exercise_history(athlete_id);

-- RLS
ALTER TABLE public.exercise_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can view own exercise history"
  ON public.exercise_history FOR SELECT
  USING (athlete_id = (SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Athletes can modify own exercise history"
  ON public.exercise_history FOR ALL
  USING (athlete_id = (SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid()));

-- 2. muscle_group_history: volumen semanal por grupo muscular
CREATE TABLE IF NOT EXISTS public.muscle_group_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  muscle_group    VARCHAR(100) NOT NULL,
  week_start      DATE NOT NULL,  -- Lunes de la semana

  sets_count      INTEGER NOT NULL DEFAULT 0,
  volume_kg       NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_rir         NUMERIC(4,2),
  session_count   INTEGER NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_muscle_group_history
  ON public.muscle_group_history(athlete_id, muscle_group, week_start);
CREATE INDEX IF NOT EXISTS idx_muscle_group_history_athlete
  ON public.muscle_group_history(athlete_id, week_start DESC);

ALTER TABLE public.muscle_group_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can manage own muscle group history"
  ON public.muscle_group_history FOR ALL
  USING (athlete_id = (SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid()));

-- 3. athlete_patterns: insights de patrones detectados
CREATE TABLE IF NOT EXISTS public.athlete_patterns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,

  pattern_type    VARCHAR(100) NOT NULL,
  -- Valores: 'plateau_detected', 'pr_streak', 'recovery_trend',
  --          'volume_spike', 'deload_suggested', 'optimal_frequency',
  --          'fatigue_accumulation', 'strength_peak'

  exercise_id     UUID REFERENCES public.exercises(id),   -- null = patrón global
  muscle_group    VARCHAR(100),                            -- null = todos

  title_es        TEXT NOT NULL,
  title_en        TEXT NOT NULL,
  description_es  TEXT NOT NULL,
  description_en  TEXT NOT NULL,

  severity        VARCHAR(20) NOT NULL DEFAULT 'info',  -- info, warning, success, critical
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_dismissed    BOOLEAN NOT NULL DEFAULT false,
  dismissed_at    TIMESTAMPTZ,

  context_data    JSONB,         -- datos que generaron el patrón
  valid_until     TIMESTAMPTZ,   -- null = siempre válido

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_athlete_patterns_athlete_active
  ON public.athlete_patterns(athlete_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_athlete_patterns_type
  ON public.athlete_patterns(athlete_id, pattern_type);

ALTER TABLE public.athlete_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can manage own patterns"
  ON public.athlete_patterns FOR ALL
  USING (athlete_id = (SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid()));

-- 4. progression_log: historial de cambios de progresión por ejercicio
CREATE TABLE IF NOT EXISTS public.progression_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id            UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  exercise_id           UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  session_id            UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,

  -- Qué método generó esta recomendación
  progression_method_id UUID REFERENCES public.progression_methods(id),

  action_type           VARCHAR(50) NOT NULL,
  -- 'weight_increase', 'rep_increase', 'deload', 'reset',
  -- 'maintain', 'set_increase', 'set_decrease'

  -- Valores anteriores
  prev_weight_kg        NUMERIC(8,2),
  prev_reps_target      INTEGER,
  prev_sets             INTEGER,

  -- Valores nuevos recomendados
  new_weight_kg         NUMERIC(8,2),
  new_reps_target       INTEGER,
  new_sets              INTEGER,

  -- Razón
  reasoning_es          TEXT,
  reasoning_en          TEXT,
  trigger_data          JSONB,   -- qué condición disparó la progresión

  -- ¿El atleta aplicó el cambio?
  applied               BOOLEAN NOT NULL DEFAULT false,
  applied_at            TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progression_log_athlete
  ON public.progression_log(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progression_log_exercise
  ON public.progression_log(athlete_id, exercise_id, created_at DESC);

ALTER TABLE public.progression_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can manage own progression log"
  ON public.progression_log FOR ALL
  USING (athlete_id = (SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid()));

-- 5. Función: actualizar exercise_history después de cada sesión completada
CREATE OR REPLACE FUNCTION public.update_exercise_history_on_session_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_athlete_id UUID;
  v_exercise_id UUID;
  rec RECORD;
BEGIN
  -- Solo ejecutar cuando status cambia a 'completed'
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  v_athlete_id := NEW.athlete_id;

  -- Para cada ejercicio de la sesión
  FOR rec IN
    SELECT DISTINCT se.exercise_id
    FROM public.session_exercises se
    WHERE se.session_id = NEW.id
  LOOP
    v_exercise_id := rec.exercise_id;

    -- Upsert exercise_history
    INSERT INTO public.exercise_history (
      athlete_id, exercise_id,
      total_sessions, total_sets, total_reps, total_volume_kg,
      best_weight_kg, best_reps_at_weight, best_1rm_estimated, pr_achieved_at,
      avg_weight_last4w, avg_reps_last4w, avg_rir_last4w, avg_sets_per_session,
      first_logged_at, last_logged_at, updated_at
    )
    SELECT
      v_athlete_id,
      v_exercise_id,
      COUNT(DISTINCT se2.session_id),
      COUNT(s2.id),
      COALESCE(SUM(s2.reps_completed), 0),
      COALESCE(SUM(s2.weight_kg * s2.reps_completed), 0),
      MAX(s2.weight_kg),
      (SELECT s3.reps_completed FROM public.sets s3
       JOIN public.session_exercises se3 ON se3.id = s3.session_exercise_id
       WHERE se3.exercise_id = v_exercise_id
       AND se3.session_id IN (SELECT id FROM public.training_sessions WHERE athlete_id = v_athlete_id)
       ORDER BY s3.weight_kg DESC, s3.reps_completed DESC LIMIT 1),
      MAX(s2.weight_kg * (1 + COALESCE(s2.reps_completed, 0)::numeric / 30)),
      MIN(ts2.session_date::timestamptz),
      MAX(ts2.session_date::timestamptz),
      now()
    FROM public.session_exercises se2
    JOIN public.sets s2 ON s2.session_exercise_id = se2.id
    JOIN public.training_sessions ts2 ON ts2.id = se2.session_id
    WHERE se2.exercise_id = v_exercise_id
    AND ts2.athlete_id = v_athlete_id
    AND s2.set_type = 'working'
    ON CONFLICT (athlete_id, exercise_id) DO UPDATE SET
      total_sessions        = EXCLUDED.total_sessions,
      total_sets            = EXCLUDED.total_sets,
      total_reps            = EXCLUDED.total_reps,
      total_volume_kg       = EXCLUDED.total_volume_kg,
      best_weight_kg        = EXCLUDED.best_weight_kg,
      best_1rm_estimated    = EXCLUDED.best_1rm_estimated,
      last_logged_at        = EXCLUDED.last_logged_at,
      updated_at            = now();

  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en training_sessions
DROP TRIGGER IF EXISTS trg_update_exercise_history ON public.training_sessions;
CREATE TRIGGER trg_update_exercise_history
  AFTER UPDATE ON public.training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exercise_history_on_session_complete();
