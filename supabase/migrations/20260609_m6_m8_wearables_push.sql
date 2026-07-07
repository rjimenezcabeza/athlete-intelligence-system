-- M6: Wearables OAuth integration
CREATE TABLE IF NOT EXISTS public.wearable_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  provider        VARCHAR(50) NOT NULL,  -- 'garmin', 'polar', 'whoop', 'fitbit', 'apple_health', 'strava'

  -- OAuth tokens (cifrados en producción via Vault)
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Estado
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_sync_at    TIMESTAMPTZ,
  sync_error      TEXT,

  -- Metadatos del provider
  provider_user_id VARCHAR(255),
  provider_data   JSONB,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_wearable_connections
  ON public.wearable_connections(athlete_id, provider);
CREATE INDEX IF NOT EXISTS idx_wearable_connections_athlete
  ON public.wearable_connections(athlete_id);

ALTER TABLE public.wearable_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can manage own wearable connections"
  ON public.wearable_connections FOR ALL
  USING (athlete_id = (SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid()));

-- M6: Datos de wearables sincronizados
CREATE TABLE IF NOT EXISTS public.wearable_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  connection_id   UUID REFERENCES public.wearable_connections(id) ON DELETE SET NULL,

  data_date       DATE NOT NULL,
  data_type       VARCHAR(50) NOT NULL,
  -- 'hrv', 'resting_hr', 'sleep_score', 'recovery_score',
  -- 'strain', 'steps', 'calories', 'stress_score'

  value           NUMERIC(10,4),
  unit            VARCHAR(20),
  raw_data        JSONB,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_wearable_data
  ON public.wearable_data(athlete_id, data_type, data_date);
CREATE INDEX IF NOT EXISTS idx_wearable_data_athlete_date
  ON public.wearable_data(athlete_id, data_date DESC);

ALTER TABLE public.wearable_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can manage own wearable data"
  ON public.wearable_data FOR ALL
  USING (athlete_id = (SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid()));

-- M8: Push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,

  endpoint        TEXT NOT NULL,
  p256dh          TEXT NOT NULL,
  auth            TEXT NOT NULL,

  notify_progression    BOOLEAN NOT NULL DEFAULT true,
  notify_patterns       BOOLEAN NOT NULL DEFAULT true,
  notify_streak         BOOLEAN NOT NULL DEFAULT true,
  notify_reminders      BOOLEAN NOT NULL DEFAULT false,

  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_push_subscriptions_endpoint
  ON public.push_subscriptions(athlete_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_athlete
  ON public.push_subscriptions(athlete_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (athlete_id = (SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid()));
