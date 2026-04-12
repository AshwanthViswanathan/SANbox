'use client'

import { startTransition, useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, LoaderCircle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  assignLessonResponseSchema,
  type DeviceLessonState,
  type LessonListItem,
} from '@/shared/api'

type DeviceLessonPanelProps = {
  deviceId: string
  deviceName: string
  lessons: LessonListItem[]
  initialLessonState: DeviceLessonState
}

export function DeviceLessonPanel({
  deviceId,
  deviceName,
  lessons,
  initialLessonState,
}: DeviceLessonPanelProps) {
  const router = useRouter()
  const [lessonState, setLessonState] = useState(initialLessonState)
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonState.assigned_lesson?.lesson_id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLessonState(initialLessonState)
    setSelectedLessonId(initialLessonState.assigned_lesson?.lesson_id ?? '')
  }, [initialLessonState])

  async function persistLessonAssignment(nextLessonId: string | null) {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch(`/api/v1/parent/devices/${deviceId}/lesson`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: nextLessonId,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to update lesson assignment')
      }

      const payload = assignLessonResponseSchema.parse(await response.json())
      const nextState: DeviceLessonState = {
        device_id: payload.device_id,
        status: payload.status,
        assigned_lesson: payload.assigned_lesson,
        active_session_id: null,
        active_lesson_id: null,
        current_step_id: null,
        started_at: null,
        completed_at: null,
        updated_at: payload.updated_at,
      }

      setLessonState(nextState)
      setSelectedLessonId(payload.assigned_lesson?.lesson_id ?? '')
      setSaved(true)
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save lesson assignment right now.')
    } finally {
      setSaving(false)
    }
  }

  const assignedLesson = lessonState.assigned_lesson
  const canAssign = Boolean(selectedLessonId) && !saving

  return (
    <div className="rounded-[1.25rem] border border-border bg-background px-4 py-4 sm:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Assigned lesson</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Choose a lesson for {deviceName}. The device can only start lessons the parent assigns here.
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.18em]',
            lessonState.status === 'none'
              ? 'bg-muted text-muted-foreground'
              : lessonState.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-700'
                : lessonState.status === 'completed'
                  ? 'bg-sky-500/10 text-sky-700'
                  : 'bg-amber-500/12 text-amber-700'
          )}
        >
          {saving ? 'SAVING' : lessonState.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-muted/30 px-4 py-4">
        {assignedLesson ? (
          <>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary-container/20 p-2 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{assignedLesson.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {assignedLesson.grade_band} • {assignedLesson.topic}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Assigned {formatDateTime(assignedLesson.assigned_at)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No lesson is assigned to {deviceName} right now.
          </p>
        )}
        <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">
          Assignment target: {deviceId}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row">
        <label className="min-w-0 flex-1">
          <span className="mb-2 block text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
            Lesson picker
          </span>
          <select
            value={selectedLessonId}
            onChange={(event) => setSelectedLessonId(event.target.value)}
            disabled={saving || lessons.length === 0}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Choose a lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.lesson_id} value={lesson.lesson_id}>
                {lesson.title} ({lesson.grade_band})
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2 self-end">
          <Button
            type="button"
            onClick={() => void persistLessonAssignment(selectedLessonId)}
            disabled={!canAssign}
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            Assign lesson
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void persistLessonAssignment(null)}
            disabled={saving || !assignedLesson}
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {(saved || error) && (
        <div
          className={cn(
            'mt-4 rounded-2xl px-3 py-3 text-xs leading-5',
            error
              ? 'bg-destructive/8 text-destructive'
              : 'bg-emerald-500/10 text-emerald-700'
          )}
        >
          {error ? (
            error
          ) : (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Lesson assignment updated.
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
