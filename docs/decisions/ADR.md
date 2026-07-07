# ADR — Architecture Decision Records

## ADR-001 — Tailwind v4 CSS-first
Decisión: Tailwind v4 con @theme en globals.css. Sin tailwind.config.ts.
Consecuencias: Tokens como CSS custom properties. Sin theme() en JS.

## ADR-002 — Next.js 16 proxy.ts
Decisión: proxy.ts con export async function proxy(). NO middleware.ts.
Consecuencias: Compatible con Vercel Edge + Supabase Auth.

## ADR-003 — Google Fonts via link tags
Decisión: Syne, DM Mono, Inter via link tags en layout.tsx. NO next/font.

## ADR-004 — Supabase createDb() sin strict types
Decisión: Helper createDb() sin tipos estrictos. (supabase as any) donde aplique.
Deuda técnica: Migrar a tipos generados post-lanzamiento.

## ADR-005 — Enum metodologías de progresión (BLOQUEADO)
type ProgressionMethod = 'double_progression' | 'double_progression_rir' | 'top_set_backoff' | 'rp_hypertrophy' | 'jordan_peters' | 'doggcrapp' | 'custom'

## ADR-006 — Arquitectura IA agnóstica
Decisión: Capa IA intercambiable (Claude / GPT / Gemini / Ollama).
Provider principal: Claude (Anthropic).

## ADR-007 — Stripe SDK v18
Decisión: Stripe SDK v18, apiVersion 2026-05-27.dahlia.

## ADR-008 — Supabase proyecto
ID: oargrsmumgfvovusyudz · Región: eu-west-1 (IE) · GDPR compliant.

## ADR-009 — Precio Pro
Decisión: €14.99/mes. Paridad con RP Hypertrophy App + diferenciación IA.

## ADR-010 — Importador Inteligente (prioridad estratégica Fase 2)
Formatos: Imagen, PDF, Excel, Word, Texto plano.
Objetivo: Información no estructurada → datos estructurados.
