# Sprint D — Coach IA + Motor Automático + Wearables + Gráficas + Push

Estado: ACTIVO

## Módulos

### 1. Coach IA Conversacional
- Chat en tiempo real con Claude API
- Contexto de historial de entrenamientos del usuario
- Streaming de respuestas
- Historial persistido en Supabase tabla ai_conversations

### 2. Motor Progresión Automática
- Basado en RP Hypertrophy principles (MEV/MRV/MAV, Dr. Mike Israetel)
- 4 proxies: pump, perturbación, disrupción, fuerza percibida
- Ajuste automático de sets semana a semana
- Detección de deload (2 sesiones consecutivas sin mejora de fuerza)

### 3. UI Logging Diario
- Set registrado en menos de 5 segundos en mobile
- Auto-fill de pesos desde sesión anterior
- Timer de descanso integrado
- Input de proxies: pump 1-5, flag perturbación, soreness al día siguiente

### 4. Wearables OAuth
- Proveedores: Garmin, Apple Health, Google Fit, Whoop, Polar
- Datos: HRV, sueño horas/score, FC en reposo, nivel recuperación
- Input para motor de progresión automática

### 5. Gráficas con Datos Reales
- Progresión de carga por ejercicio (timeline)
- Volumen semanal por grupo muscular
- 1RM estimado por ejercicio
- Adherencia al plan (% sesiones completadas)
- Correlación sueño/HRV → rendimiento en sesión

### 6. PWA Push Notifications
- Recordatorio de sesión programada
- Streak alerts (N días sin entrenar)
- Sugerencias del coach IA
- Alerta de deload detectado

## Orden de implementación recomendado
1. UI Logging Diario (base para todo lo demás)
2. Gráficas con datos reales (valida que los datos del Logger son correctos)
3. Motor progresión automática (algoritmos sobre datos reales)
4. Coach IA conversacional (usa contexto del motor)
5. PWA Push Notifications
6. Wearables OAuth (enriquece el contexto de recuperación)
