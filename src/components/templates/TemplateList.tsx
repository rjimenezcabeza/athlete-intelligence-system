'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, ChevronRight, Dumbbell } from 'lucide-react'

interface Exercise { id: string; name: string; muscle_group_primary: string }
interface TemplateExercise { id: string; day_number: number; day_label: string | null; order_in_day: number; sets_target: number | null; rep_range_min: number | null; rep_range_max: number | null; exercise: Exercise }
interface Template { id: string; name: string; description: string | null; training_days_per_week: number | null; split_type: string | null; template_exercises: TemplateExercise[] }
interface ProgressionMethod { id: string; name: string; method_type: string }

export function TemplateList({ templates, progressionMethods }: { templates: Template[]; progressionMethods: ProgressionMethod[] }) {
  const router = useRouter()
  const locale = useLocale()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  void progressionMethods

  const createTemplate = async () => {
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/training/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, trainingDaysPerWeek: 4 }),
    })
    if (res.ok) { router.refresh(); setShowForm(false); setName('') }
    setLoading(false)
  }

  if (!templates.length && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Dumbbell className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Sin plantillas</p>
          <p className="text-xs text-muted-foreground mt-1">Crea tu primera rutina de entrenamiento</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Nueva plantilla
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {templates.map(t => {
        const days = [...new Set(t.template_exercises.map(te => te.day_number))].sort()
        return (
          <div key={t.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.training_days_per_week} días/semana · {t.template_exercises.length} ejercicios
                </p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/training/session?templateId=${t.id}`)}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                Entrenar <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {days.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {days.map(d => {
                  const dayExs = t.template_exercises.filter(te => te.day_number === d)
                  const label = dayExs[0]?.day_label ?? `Día ${d}`
                  return (
                    <span key={d} className="text-[11px] bg-muted/50 rounded-lg px-2.5 py-1 text-muted-foreground">
                      {label} · {dayExs.length} ej.
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {showForm ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-medium">Nueva plantilla</p>
          <div className="space-y-1.5">
            <Label htmlFor="tname" className="text-xs">Nombre</Label>
            <Input
              id="tname"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createTemplate()}
              placeholder="ej. PPL Powerbuilding"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createTemplate} disabled={loading || !name.trim()} className="flex-1">
              {loading ? 'Creando...' : 'Crear'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setName('') }} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Nueva plantilla
        </Button>
      )}
    </div>
  )
}
