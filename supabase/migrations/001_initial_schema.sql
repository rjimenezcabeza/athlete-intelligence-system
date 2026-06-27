CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE weight_unit AS ENUM ('kg','lbs');
CREATE TYPE subscription_tier AS ENUM ('free','pro','coach','admin');
CREATE TYPE set_type AS ENUM ('warmup','working','top_set','backoff','myorep','rest_pause','failure');
CREATE TYPE progression_method_type AS ENUM ('double_progression','double_progression_rir','top_set_backoff','rp_hypertrophy','jordan_peters','doggcrapp','custom');
CREATE TYPE import_status AS ENUM ('pending','processing','review_required','approved','rejected','error');
CREATE TYPE ai_recommendation_type AS ENUM ('pre_workout','progression','deload','fatigue_warning','form_alert','import_review','custom');
CREATE TYPE user_action AS ENUM ('accepted','rejected','modified','ignored','pending');
CREATE TYPE session_source AS ENUM ('manual','imported','ai_generated');
CREATE TYPE review_status AS ENUM ('pending','approved','rejected','modified');
CREATE TYPE item_type AS ENUM ('session','exercise','set','template');
CREATE TYPE movement_pattern AS ENUM ('push','pull','hinge','squat','carry','isolation','compound');

CREATE TABLE athlete_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  body_weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,1),
  date_of_birth DATE,
  gender VARCHAR(20),
  weight_unit weight_unit NOT NULL DEFAULT 'kg',
  language VARCHAR(10) NOT NULL DEFAULT 'es',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Madrid',
  training_experience_years INTEGER CHECK (training_experience_years >= 0),
  primary_goal VARCHAR(50) DEFAULT 'hypertrophy',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  muscle_group_primary VARCHAR(50) NOT NULL,
  muscle_groups_secondary TEXT[] NOT NULL DEFAULT '{}',
  equipment VARCHAR(50),
  movement_pattern movement_pattern,
  exercise_type VARCHAR(30) NOT NULL DEFAULT 'strength',
  is_bilateral BOOLEAN NOT NULL DEFAULT TRUE,
  difficulty_level INTEGER NOT NULL DEFAULT 2 CHECK (difficulty_level BETWEEN 1 AND 5),
  description TEXT,
  cues TEXT[] DEFAULT '{}',
  video_url TEXT,
  is_global BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE progression_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  method_type progression_method_type NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  natural_language_description TEXT,
  structured_rules JSONB,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE imported_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  original_filename TEXT NOT NULL,
  file_type VARCHAR(10) CHECK (file_type IN ('image','pdf','excel','word','text')),
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  import_status import_status NOT NULL DEFAULT 'pending',
  extracted_data JSONB,
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence BETWEEN 0 AND 1),
  extraction_notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);

CREATE TABLE training_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  training_days_per_week INTEGER DEFAULT 4 CHECK (training_days_per_week BETWEEN 1 AND 7),
  split_type VARCHAR(50),
  mesocycle_weeks INTEGER DEFAULT 6,
  default_progression_method_id UUID REFERENCES progression_methods(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  imported_from_file_id UUID REFERENCES imported_files(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  progression_method_id UUID REFERENCES progression_methods(id) ON DELETE SET NULL,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  day_label VARCHAR(50),
  order_in_day INTEGER NOT NULL CHECK (order_in_day >= 1),
  sets_target INTEGER DEFAULT 3,
  rep_range_min INTEGER,
  rep_range_max INTEGER,
  rir_target INTEGER CHECK (rir_target BETWEEN 0 AND 5),
  rest_seconds INTEGER DEFAULT 120,
  tempo VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  template_id UUID REFERENCES training_templates(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_number INTEGER,
  day_label VARCHAR(50),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL AND started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER / 60 ELSE NULL END
  ) STORED,
  readiness_score INTEGER CHECK (readiness_score BETWEEN 1 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 10),
  notes TEXT,
  body_weight_kg DECIMAL(5,2),
  source session_source NOT NULL DEFAULT 'manual',
  imported_from_file_id UUID REFERENCES imported_files(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  template_exercise_id UUID REFERENCES template_exercises(id) ON DELETE SET NULL,
  order_in_session INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID NOT NULL,
  set_number INTEGER NOT NULL CHECK (set_number >= 1),
  set_type set_type NOT NULL DEFAULT 'working',
  weight_kg DECIMAL(6,2) CHECK (weight_kg >= 0),
  reps_completed INTEGER CHECK (reps_completed >= 0),
  rir_actual INTEGER CHECK (rir_actual BETWEEN 0 AND 10),
  rpe_actual DECIMAL(3,1) CHECK (rpe_actual BETWEEN 1 AND 10),
  duration_seconds INTEGER,
  is_personal_record BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  template_exercise_id UUID REFERENCES template_exercises(id) ON DELETE CASCADE,
  recommendation_type ai_recommendation_type NOT NULL,
  recommendation_text TEXT NOT NULL,
  reasoning TEXT,
  context_data JSONB,
  user_action user_action DEFAULT 'pending',
  user_notes TEXT,
  action_taken_at TIMESTAMPTZ,
  ai_model VARCHAR(50),
  ai_provider VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE import_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_file_id UUID NOT NULL,
  item_type item_type NOT NULL,
  raw_extracted JSONB NOT NULL,
  corrected_data JSONB,
  review_status review_status NOT NULL DEFAULT 'pending',
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- FKs que requieren todas las tablas creadas
ALTER TABLE athlete_profiles ADD CONSTRAINT fk_ap_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE imported_files ADD CONSTRAINT fk_if_athlete FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) ON DELETE CASCADE;
ALTER TABLE training_templates ADD CONSTRAINT fk_tt_athlete FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) ON DELETE CASCADE;
ALTER TABLE template_exercises ADD CONSTRAINT fk_te_template FOREIGN KEY (template_id) REFERENCES training_templates(id) ON DELETE CASCADE;
ALTER TABLE training_sessions ADD CONSTRAINT fk_ts_athlete FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) ON DELETE CASCADE;
ALTER TABLE session_exercises ADD CONSTRAINT fk_se_session FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE;
ALTER TABLE sets ADD CONSTRAINT fk_s_session_exercise FOREIGN KEY (session_exercise_id) REFERENCES session_exercises(id) ON DELETE CASCADE;
ALTER TABLE ai_recommendations ADD CONSTRAINT fk_ar_athlete FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) ON DELETE CASCADE;
ALTER TABLE import_review_items ADD CONSTRAINT fk_iri_file FOREIGN KEY (imported_file_id) REFERENCES imported_files(id) ON DELETE CASCADE;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_athlete_profiles_updated_at BEFORE UPDATE ON athlete_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_progression_methods_updated_at BEFORE UPDATE ON progression_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_training_templates_updated_at BEFORE UPDATE ON training_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_template_exercises_updated_at BEFORE UPDATE ON template_exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_training_sessions_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_athlete_profiles_user_id ON athlete_profiles(user_id);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group_primary);
CREATE INDEX idx_exercises_global ON exercises(is_global) WHERE is_global = TRUE;
CREATE INDEX idx_training_templates_athlete ON training_templates(athlete_id);
CREATE INDEX idx_training_sessions_athlete_date ON training_sessions(athlete_id, session_date DESC);
CREATE INDEX idx_session_exercises_session ON session_exercises(session_id);
CREATE INDEX idx_sets_session_exercise ON sets(session_exercise_id);
CREATE INDEX idx_sets_pr ON sets(session_exercise_id, is_personal_record) WHERE is_personal_record = TRUE;
CREATE INDEX idx_ai_recommendations_athlete ON ai_recommendations(athlete_id, created_at DESC);

-- RLS
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression_methods ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_athlete_id() RETURNS UUID AS $$ SELECT id FROM athlete_profiles WHERE user_id = auth.uid() LIMIT 1; $$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE POLICY "athlete_own_profile" ON athlete_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "exercises_read" ON exercises FOR SELECT USING (is_global = TRUE OR created_by = auth.uid());
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (created_by = auth.uid() AND is_global = FALSE);
CREATE POLICY "exercises_update" ON exercises FOR UPDATE USING (created_by = auth.uid() AND is_global = FALSE);
CREATE POLICY "exercises_delete" ON exercises FOR DELETE USING (created_by = auth.uid() AND is_global = FALSE);
CREATE POLICY "progression_methods_read" ON progression_methods FOR SELECT USING (created_by IS NULL OR created_by = auth.uid());
CREATE POLICY "progression_methods_write" ON progression_methods FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "templates_own" ON training_templates FOR ALL USING (athlete_id = get_athlete_id());
CREATE POLICY "template_exercises_own" ON template_exercises FOR ALL USING (template_id IN (SELECT id FROM training_templates WHERE athlete_id = get_athlete_id()));
CREATE POLICY "sessions_own" ON training_sessions FOR ALL USING (athlete_id = get_athlete_id());
CREATE POLICY "session_exercises_own" ON session_exercises FOR ALL USING (session_id IN (SELECT id FROM training_sessions WHERE athlete_id = get_athlete_id()));
CREATE POLICY "sets_own" ON sets FOR ALL USING (session_exercise_id IN (SELECT se.id FROM session_exercises se JOIN training_sessions ts ON ts.id = se.session_id WHERE ts.athlete_id = get_athlete_id()));
CREATE POLICY "ai_recommendations_own" ON ai_recommendations FOR ALL USING (athlete_id = get_athlete_id());
CREATE POLICY "imported_files_own" ON imported_files FOR ALL USING (athlete_id = get_athlete_id());
CREATE POLICY "import_review_items_own" ON import_review_items FOR ALL USING (imported_file_id IN (SELECT id FROM imported_files WHERE athlete_id = get_athlete_id()));
