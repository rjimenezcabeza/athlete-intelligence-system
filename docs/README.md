# AIS — Athlete Intelligence System

> **"No estamos construyendo una aplicación de entrenamiento. Estamos construyendo un sistema operativo para atletas de hipertrofia."**

## Identidad del producto

| Campo | Valor |
|---|---|
| Nombre | Athlete Intelligence System (AIS) |
| Tipo | Mobile-first PWA SaaS |
| Target | Atletas de hipertrofia, bodybuilders, coaches |
| Modelo | Freemium + Pro (€14.99/mes) |
| Estado actual | Sprint D activo |

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15/16, TypeScript, Tailwind v4 (CSS-first @theme), Shadcn UI |
| Backend | Supabase (proyecto oargrsmumgfvovusyudz, región eu-west-1 IE) |
| IA | Anthropic Claude (agnóstica: Claude / GPT / Gemini / Ollama) |
| Pagos | Stripe SDK v18, apiVersion 2026-05-27.dahlia |
| Deploy | Vercel vía GitHub Actions CI/CD |
| Estado | Zustand (session store) |
| i18n | ES / EN desde Sprint A |

## Design System

Accent:     #C8FF00
Background: #0A0A0F
Fonts:      Syne / DM Mono / Inter (via link tags en layout.tsx, NO next/font)

## Decisiones técnicas bloqueadas (NO cambiar sin ADR)

1. Tailwind v4: Sin tailwind.config.ts. Config vía @theme en globals.css
2. Next.js 16: proxy.ts con export async function proxy() (NO middleware.ts)
3. Google Fonts: link tags en layout.tsx (NO next/font)
4. Supabase types: Helper createDb() sin strict types. Casts (supabase as any) donde aplique
5. Progresión enum: double_progression, double_progression_rir, top_set_backoff, rp_hypertrophy, jordan_peters, doggcrapp, custom

## Estado de Sprints

| Sprint | Estado | Contenido |
|---|---|---|
| A (Sprint 1) | COMPLETO | Auth Supabase completa |
| B (Sprint 2) | COMPLETO | 12 tablas DB con RLS/triggers, 45 ejercicios seed |
| C (Sprint 3) | COMPLETO | Motor progresión, SetLogger, PWA manifest, Service Worker, i18n, CI/CD Vercel, Stripe, Dashboard, session/template API routes, Zustand store |
| D (Sprint 4) | ACTIVO | Coach IA conversacional, motor progresión automática, UI logging diario, wearables OAuth, gráficas datos reales, push notifications PWA |

## Principios obligatorios

1. IA asesora, nunca decide — confirma acciones críticas
2. Automatización máxima — mínima intervención manual
3. Mobile First — registro de set < 5 segundos
4. SaaS-ready — multiusuario, coaches, admins desde el diseño
5. Multiidioma — i18n desde el inicio
6. Modularidad — cada módulo evoluciona independientemente
7. Persistencia del conocimiento — documentar toda decisión

## Supabase
- ID: oargrsmumgfvovusyudz
- Región: eu-west-1 (Irlanda)
- CLI login: npx supabase login --token <token>
- Push: npx supabase db push --project-ref oargrsmumgfvovusyudz
