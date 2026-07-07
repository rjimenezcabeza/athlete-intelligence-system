@AGENTS.md

# Athlete Intelligence System — Referencia Técnica

## Stack exacto

| Tecnología | Versión | Notas |
|---|---|---|
| Next.js | 16.2.7 | App Router, Turbopack activado |
| React | 19.2.4 | |
| Tailwind CSS | ^4 | **CSS-first** — no tailwind.config.js, tokens en globals.css |
| Supabase JS | ^2.107.0 | @supabase/ssr ^0.10.3 para SSR |
| Anthropic SDK | ^0.100.1 | `serverExternalPackages` en next.config.ts |
| Stripe | ^22.2.1 | stripe (server) + @stripe/stripe-js ^9.8.0 (client) |
| next-intl | ^4.13.0 | 6 locales: es, en, fr, de, it, nl |
| TanStack Query | ^5.101.0 | estado servidor |
| Zustand | ^5.0.14 | estado cliente |
| Recharts | ^3.8.1 | gráficas |
| Vitest | ^4.1.8 | tests unitarios |
| Playwright | ^1.60.0 | tests e2e |

**Turbopack** configurado en `next.config.ts`:
```ts
turbopack: { root: __dirname }
```

**Anthropic model activo**: `claude-sonnet-4-6` (en import/process y ai/suggestions).

---

## Supabase

- **Project ID**: `oargrsmumgfvovusyudz`
- **Región**: `eu-west-1` (Irlanda)
- **URL**: `https://oargrsmumgfvovusyudz.supabase.co`
- **Storage bucket**: `imports` (para archivos de importación de atletas)

### Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL      # público — URL del proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY # público — solo para auth client-side (signInWithPassword)
SUPABASE_SERVICE_ROLE_KEY     # SECRETO — solo server-side, bypasea RLS
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

---

## Reglas críticas de autenticación

### 1. SERVICE_ROLE_KEY — exclusivamente server-side

**NUNCA** usar `SUPABASE_SERVICE_ROLE_KEY` en código cliente. Únicamente en Route Handlers (`/api/**`).

La única excepción a usar `ANON_KEY` es `signInWithPassword` en el cliente (el bug histórico fue usar SERVICE_ROLE_KEY para auth, causando todos los 401).

### 2. athlete_id ≠ auth.users.id

`athlete_id` en todas las tablas referencia **`athlete_profiles.id`**, NO `auth.users.id`.

Flujo obligatorio en cada route handler:
```ts
// 1. Obtener auth user (su UUID de auth.users)
const user = await getUser()          // user.id = auth.users.id

// 2. Resolver athlete_profiles.id
const { data: profile } = await (admin as any)
  .from('athlete_profiles').select('id').eq('user_id', user.id).single()

// 3. Usar profile.id como athlete_id en todas las demás tablas
const { data } = await (admin as any)
  .from('training_sessions').insert({ athlete_id: profile.id, ... })
```

### 3. Dos clientes Supabase por route handler

```ts
// Para verificar sesión de usuario (con cookies)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUser() {
  const store = await cookies()
  const s = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll() { return store.getAll() }, setAll() {} } }
  )
  return (await s.auth.getUser()).data.user
}

// Para operaciones DB (bypasea RLS, sin sesión)
import { createClient } from '@supabase/supabase-js'

function adminDb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

---

## Patrones de código obligatorios

### supabase as any

El cliente de Supabase no infiere tipos sin el type generado. Todas las llamadas DB llevan cast:
```ts
const admin = adminDb()
const { data } = await (admin as any).from('tabla').select('*')
```

### params como Promise en Next.js 16

En route handlers con segmentos dinámicos, `params` es una `Promise`:
```ts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  // ...
}
```

### Buffer para archivos binarios

No usar `.toString('utf8')` para archivos descargados de storage. Usar `arrayBuffer`:
```ts
const fetchRes = await fetch(signedUrl)
const buf = Buffer.from(await fetchRes.arrayBuffer())
// buf.toString('base64') para imágenes
// buf.toString('utf8') solo para texto plano
```

### Respuestas API — payload mínimo

Por el límite de 4.5MB de Vercel, las respuestas de routes que procesan archivos grandes devuelven solo metadatos, nunca el `extracted_data` completo:
```ts
// MAL: return NextResponse.json({ success: true, data: extractedData })  // puede ser MB
// BIEN:
return NextResponse.json({ success: true, confidence, status, sessionsFound: sessions.length })
```

### env vars — trim() obligatorio

```ts
process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()  // evita BOM y espacios invisibles
```

---

## Límites Vercel Free Plan

| Límite | Valor |
|---|---|
| Request/Response body | **4.5 MB** |
| Función default maxDuration | 10s |
| Upload route maxDuration | 30s (en vercel.json) |
| Process route maxDuration | 60s (en vercel.json) |

**Umbrales de código**:
- `/api/import/upload`: rechaza archivos > 4MB con `{ error: 'FILE_TOO_LARGE_FOR_PROXY', useDirectUpload: true }` (status 413) — el cliente debe usar signed URL en ese caso.
- `/api/import/process`: `export const maxDuration = 60` al inicio del archivo.

**Límites de negocio (plan free)**:
- Importaciones: 3/mes por atleta (verificado en `/api/import/upload`)

---

## Esquema de base de datos (public)

### athlete_profiles
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| display_name | varchar | NO | — |
| avatar_url | text | YES | — |
| body_weight_kg | numeric | YES | — |
| height_cm | numeric | YES | — |
| date_of_birth | date | YES | — |
| gender | varchar | YES | — |
| weight_unit | enum | NO | 'kg' |
| language | varchar | NO | 'es' |
| timezone | varchar | NO | 'Europe/Madrid' |
| training_experience_years | int | YES | — |
| primary_goal | varchar | YES | 'hypertrophy' |
| subscription_tier | enum | NO | 'free' |
| subscription_expires_at | timestamptz | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### training_sessions
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| template_id | uuid | YES | — |
| session_date | date | NO | CURRENT_DATE |
| day_number | int | YES | — |
| day_label | varchar | YES | — |
| started_at | timestamptz | YES | — |
| ended_at | timestamptz | YES | — |
| duration_minutes | int | YES | — |
| readiness_score | int | YES | — |
| sleep_quality | int | YES | — |
| stress_level | int | YES | — |
| performance_rating | int | YES | — |
| notes | text | YES | — |
| body_weight_kg | numeric | YES | — |
| source | enum | NO | 'manual' |
| imported_from_file_id | uuid | YES | — |
| pump_rating | int | YES | — |
| local_fatigue | int | YES | — |
| perceived_recovery | int | YES | — |
| rir_session_avg | numeric | YES | — |
| feedback_completed_at | timestamptz | YES | — |
| status | text | NO | 'active' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### session_exercises
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| session_id | uuid | NO | — |
| exercise_id | uuid | NO | — |
| template_exercise_id | uuid | YES | — |
| order_in_session | int | NO | — |
| created_at | timestamptz | NO | now() |

### sets
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| session_exercise_id | uuid | NO | — |
| set_number | int | NO | — |
| set_type | enum | NO | 'working' |
| weight_kg | numeric | YES | — |
| reps_completed | int | YES | — |
| rir_actual | int | YES | — |
| rpe_actual | numeric | YES | — |
| duration_seconds | int | YES | — |
| is_personal_record | bool | NO | false |
| notes | text | YES | — |
| logged_at | timestamptz | NO | now() |

### exercises
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| name | varchar | NO | — |
| slug | varchar | NO | — |
| muscle_group_primary | varchar | NO | — |
| muscle_groups_secondary | text[] | NO | '{}' |
| equipment | varchar | YES | — |
| movement_pattern | enum | YES | — |
| exercise_type | varchar | NO | 'strength' |
| is_bilateral | bool | NO | true |
| difficulty_level | int | NO | 2 |
| description | text | YES | — |
| cues | text[] | YES | '{}' |
| video_url | text | YES | — |
| is_global | bool | NO | true |
| created_by | uuid | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### training_templates
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| name | varchar | NO | — |
| description | text | YES | — |
| training_days_per_week | int | YES | 4 |
| split_type | varchar | YES | — |
| mesocycle_weeks | int | YES | 6 |
| default_progression_method_id | uuid | YES | — |
| is_active | bool | NO | true |
| is_archived | bool | NO | false |
| imported_from_file_id | uuid | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### template_exercises
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| template_id | uuid | NO | — |
| exercise_id | uuid | NO | — |
| progression_method_id | uuid | YES | — |
| day_number | int | NO | — |
| day_label | varchar | YES | — |
| order_in_day | int | NO | — |
| sets_target | int | YES | 3 |
| rep_range_min | int | YES | — |
| rep_range_max | int | YES | — |
| rir_target | int | YES | — |
| rest_seconds | int | YES | 120 |
| tempo | varchar | YES | — |
| notes | text | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### imported_files
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| original_filename | text | NO | — |
| file_type | varchar | YES | — |
| storage_path | text | NO | — |
| file_size_bytes | int | YES | — |
| import_status | enum | NO | 'pending' |
| extracted_data | jsonb | YES | — |
| extraction_confidence | numeric | YES | — |
| extraction_notes | text | YES | — |
| uploaded_at | timestamptz | NO | now() |
| processed_at | timestamptz | YES | — |
| approved_at | timestamptz | YES | — |

### import_review_items
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| imported_file_id | uuid | NO | — |
| item_type | enum | NO | — |
| raw_extracted | jsonb | NO | — |
| corrected_data | jsonb | YES | — |
| review_status | enum | NO | 'pending' |
| confidence_score | numeric | YES | — |
| created_at | timestamptz | NO | now() |
| reviewed_at | timestamptz | YES | — |

### exercise_history
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| exercise_id | uuid | NO | — |
| total_sessions | int | NO | 0 |
| total_sets | int | NO | 0 |
| total_reps | int | NO | 0 |
| total_volume_kg | numeric | NO | 0 |
| best_weight_kg | numeric | YES | — |
| best_reps_at_weight | int | YES | — |
| best_1rm_estimated | numeric | YES | — |
| pr_set_id | uuid | YES | — |
| pr_achieved_at | timestamptz | YES | — |
| avg_weight_last4w | numeric | YES | — |
| avg_reps_last4w | numeric | YES | — |
| avg_rir_last4w | numeric | YES | — |
| avg_sets_per_session | numeric | YES | — |
| weight_trend | numeric | YES | — |
| volume_trend | numeric | YES | — |
| first_logged_at | timestamptz | YES | — |
| last_logged_at | timestamptz | YES | — |
| updated_at | timestamptz | NO | now() |

### athlete_patterns
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| pattern_type | varchar | NO | — |
| exercise_id | uuid | YES | — |
| muscle_group | varchar | YES | — |
| title_es | text | NO | — |
| title_en | text | NO | — |
| description_es | text | NO | — |
| description_en | text | NO | — |
| severity | varchar | NO | 'info' |
| is_active | bool | NO | true |
| is_dismissed | bool | NO | false |
| dismissed_at | timestamptz | YES | — |
| context_data | jsonb | YES | — |
| valid_until | timestamptz | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### ai_recommendations
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| session_id | uuid | YES | — |
| template_exercise_id | uuid | YES | — |
| recommendation_type | enum | NO | — |
| recommendation_text | text | NO | — |
| reasoning | text | YES | — |
| context_data | jsonb | YES | — |
| user_action | enum | YES | 'pending' |
| user_notes | text | YES | — |
| action_taken_at | timestamptz | YES | — |
| ai_model | varchar | YES | — |
| ai_provider | varchar | YES | — |
| created_at | timestamptz | NO | now() |

### progression_methods
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| name | varchar | NO | — |
| slug | varchar | NO | — |
| method_type | enum | NO | — |
| config | jsonb | NO | '{}' |
| natural_language_description | text | YES | — |
| structured_rules | jsonb | YES | — |
| is_custom | bool | NO | false |
| created_by | uuid | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### progression_log
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| exercise_id | uuid | NO | — |
| session_id | uuid | YES | — |
| progression_method_id | uuid | YES | — |
| action_type | varchar | NO | — |
| prev_weight_kg | numeric | YES | — |
| prev_reps_target | int | YES | — |
| prev_sets | int | YES | — |
| new_weight_kg | numeric | YES | — |
| new_reps_target | int | YES | — |
| new_sets | int | YES | — |
| reasoning_es | text | YES | — |
| reasoning_en | text | YES | — |
| trigger_data | jsonb | YES | — |
| applied | bool | NO | false |
| applied_at | timestamptz | YES | — |
| created_at | timestamptz | NO | now() |

### muscle_group_history
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| muscle_group | varchar | NO | — |
| week_start | date | NO | — |
| sets_count | int | NO | 0 |
| volume_kg | numeric | NO | 0 |
| avg_rir | numeric | YES | — |
| session_count | int | NO | 0 |
| created_at | timestamptz | NO | now() |

### push_subscriptions
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| endpoint | text | NO | — |
| p256dh | text | NO | — |
| auth | text | NO | — |
| notify_progression | bool | NO | true |
| notify_patterns | bool | NO | true |
| notify_streak | bool | NO | true |
| notify_reminders | bool | NO | false |
| user_agent | text | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### wearable_connections
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| provider | varchar | NO | — |
| access_token | text | YES | — |
| refresh_token | text | YES | — |
| token_expires_at | timestamptz | YES | — |
| is_active | bool | NO | true |
| last_sync_at | timestamptz | YES | — |
| sync_error | text | YES | — |
| provider_user_id | varchar | YES | — |
| provider_data | jsonb | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### wearable_data
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| athlete_id | uuid | NO | — |
| connection_id | uuid | YES | — |
| data_date | date | NO | — |
| data_type | varchar | NO | — |
| value | numeric | YES | — |
| unit | varchar | YES | — |
| raw_data | jsonb | YES | — |
| created_at | timestamptz | NO | now() |

---

## Estructura de rutas

### Páginas (`/[locale]/`)

```
(auth)/
  login/           — LoginForm, cookies server-side
  register/        — registro via /api/auth/register

(dashboard)/
  dashboard/       — resumen, stats, sesiones recientes
  history/         — historial de sesiones pasadas
  import/          — subida y procesamiento de archivos (AI)
  memory/          — patrones detectados por IA
  profile/         — perfil del atleta
  progress/        — gráficas de progreso (ChartsClient.tsx separado)
  onboarding/      — onboarding inicial
  upgrade/         — planes Pro (Stripe)
  upgrade/success/ — confirmación post-pago
  coach/           — chat con coach IA
  exercises/       — biblioteca de ejercicios
  session/new/     — crear nueva sesión
  session/[id]/         — sesión activa (logger de sets)
  session/[id]/feedback/ — feedback post-sesión
  training/session/      — entrenamiento desde plantilla
  training/templates/    — gestión de plantillas
  training/history/      — historial por plantilla
```

### API Routes (`/api/`)

**Auth**
- `POST /api/auth/login` — signInWithPassword vía ANON_KEY
- `POST /api/auth/register` — registro nuevo usuario
- `POST /api/auth/logout` — cierra sesión
- `GET  /api/auth/me` — devuelve userId y email de la sesión activa

**Sessions**
- `POST /api/sessions/start` — crea training_session con status='active', guarda started_at
- `GET  /api/sessions/active` — sesión activa del atleta
- `POST /api/sessions/add-exercise` — añade session_exercise
- `GET  /api/sessions/history` — historial paginado
- `GET  /api/sessions/history-list` — lista simplificada
- `POST /api/sessions/[id]/sets` — registra un set
- `DELETE /api/sessions/[id]/sets` — elimina un set
- `POST /api/sessions/[id]/end` — finaliza sesión, calcula duration_minutes desde started_at
- `POST /api/sessions/[id]/feedback` — guarda ratings post-sesión
- `GET  /api/sessions/[id]/exercises` — ejercicios de una sesión

**Import (archivos de entrenamiento)**
- `POST /api/import/upload` — sube archivo ≤4MB al storage `imports/`; free: 3/mes
- `POST /api/import/process` — extrae sesiones con Claude (maxDuration: 60s)
- `GET  /api/import/list` — lista imported_files del atleta
- `GET/DELETE /api/import/[id]` — detalle o eliminación de un import
- `POST /api/import/signed-url` — genera signed URL para descarga server-side
- `GET  /api/import/upload-url` — genera upload URL directa (archivos >4MB)
- `POST /api/import/approve` — aprueba sesiones extraídas e inserta en training_sessions
- `POST /api/import/review` — actualiza review_status de import_review_items

**Dashboard**
- `GET /api/dashboard/summary` — stats principales (sesiones, volumen, streaks)
- `GET /api/dashboard/stats` — estadísticas extendidas
- `GET /api/charts/data` — datos para gráficas de Recharts

**AI / Coach**
- `POST /api/ai/suggestions` — sugerencias de progresión
- `POST /api/ai/coach` — respuesta del coach IA
- `POST /api/ai/progression` — calcula progresión automática
- `POST /api/coach/chat` — chat streaming con el coach

**Exercises**
- `GET /api/exercises/search` — búsqueda por nombre/músculo

**Profile**
- `GET/PUT /api/profile` — perfil completo
- `GET     /api/profile/me` — perfil del usuario autenticado
- `GET     /api/profile/get` — perfil por user_id
- `POST    /api/profile/ensure` — crea perfil si no existe

**Memory / Patterns**
- `GET /api/memory/analyze` — analiza patrones del atleta
- `GET /api/memory/history` — historial de patterns
- `GET /api/memory/patterns` — patterns activos
- `GET /api/memory/summary` — resumen de memoria IA

**Progression**
- `GET /api/progression/calculate` — calcula próxima progresión
- `GET /api/progression/history` — historial de progression_log

**Progress**
- `GET /api/progress/exercise` — datos de progreso por ejercicio

**Stripe**
- `POST /api/stripe/checkout` — crea checkout session
- `POST /api/stripe/portal` — portal de gestión
- `POST /api/stripe/webhook` — webhook de eventos Stripe

**Push Notifications**
- `POST /api/push/subscribe` — registra push_subscription
- `POST /api/push/send` — envía notificación web-push

**Wearables**
- `GET /api/wearables/status` — estado de conexión
- `GET /api/wearables/connect` — inicia OAuth wearable
- `GET /api/wearables/callback` — callback OAuth

**Onboarding**
- `POST /api/onboarding/complete` — marca onboarding como completado

**Admin**
- `POST /api/admin/grant-pro` — concede plan Pro manualmente (maxDuration: 10s)

---

## Internacionalización

- Locales: `es` (default), `en`, `fr`, `de`, `it`, `nl`
- Configuración: `src/i18n/config.ts`
- Mensajes: `src/i18n/messages/[locale].json`
- Rutas bajo `[locale]/(auth)/` y `[locale]/(dashboard)/`
- Auth callback: `[locale]/auth/callback/route.ts`

---

## Estado del sprint (2026-06-21)

### Último commit estable
`1ad3229 revert: restaurar estado funcional pre-rediseno`

Se revirtió un intento de redesign premium (commits `5dc40fc`, `00ea540`, `77831bd`, `ee20e95`) que introdujo inestabilidad.

### Funcionalidades core operativas
- Auth completo (login/register/logout) — service-role cookie pattern
- Sesiones: start → add-exercise → log-sets → end → feedback
- Búsqueda de ejercicios
- Import AI: upload → process (Claude claude-sonnet-4-6) → review → approve
- Dashboard summary
- Suscripciones Stripe (free/pro)
- i18n 6 idiomas

### Trabajo en curso (sin commitear)
Hay ~40 archivos modificados/nuevos en working tree:
- **Nuevos locales**: mensajes `fr`, `de`, `it`, `nl` añadidos
- **Nuevas rutas API**: `admin/grant-pro`, `ai/suggestions`, `import/[id]`, `import/signed-url`, `import/upload-url`, `memory/summary`, `profile/me`, `progress/exercise`
- **Hooks**: `useDashboardSummary`, `useSubscription` refactorizados
- **Componentes i18n**: login, dashboard, history, import, memory, profile, progress, session pages — migrados a next-intl
- **Limites Vercel**: lógica de `FILE_TOO_LARGE_FOR_PROXY` y signed URL para archivos >4MB

### Bug histórico resuelto
`a3be720` — login usaba `SERVICE_ROLE_KEY` para `signInWithPassword`, causando 401 en todas las rutas. Resuelto: login usa `ANON_KEY` client-side; el resto de routes usa `SERVICE_ROLE_KEY` exclusivamente server-side.

### Bug histórico resuelto
`06f7d3d` — archivos con BOM (Byte Order Mark) en env vars causaban URLs malformadas. Resuelto: `.trim()` en todas las lecturas de env vars.
