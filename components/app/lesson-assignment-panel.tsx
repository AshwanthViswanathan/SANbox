'use client'

import { startTransition, useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, LoaderCircle, Radio } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  assignLessonResponseSchema,
  type DeviceLessonState,
  type LessonListItem,
} from '@/shared/api'

type LessonAssignmentDevice = {
  id: string
  name: string
  status: 'online' | 'offline'
  lessonState: DeviceLessonState
}

type LessonAssignmentPanelProps = {
  lesson: LessonListItem
  devices: LessonAssignmentDevice[]
}

export function LessonAssignmentPanel({
  lesson,
  devices,
}: LessonAssignmentPanelProps) {
  const router = useRouter()
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const assignedDevices = devices.filter(
    (device) => device.lessonState.assigned_lesson?.lesson_id === lesson.lesson_id
  )

  const unassignedDeviceOptions = devices.filter(
    (device) => device.lessonState.assigned_lesson?.lesson_id !== lesson.lesson_id
  )

  useEffect(() => {
    if (
      selectedDeviceId &&
      !unassignedDeviceOptions.some((device) => device.id === selectedDeviceId)
    ) {
      setSelectedDeviceId('')
    }
  }, [selectedDeviceId, unassignedDeviceOptions])

  async function assignToDevice(deviceId: string) {
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
          lesson_id: lesson.lesson_id,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to assign lesson')
      }

      assignLessonResponseSchema.parse(await response.json())
      setSelectedDeviceId('')
      setSaved(true)
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign lesson right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Assign to device</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Push this lesson to a device so it can start from the parent-approved lesson queue.
          </p>
        </div>
        <span className="rounded-full bg-primary-container/20 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-primary">
          {assignedDevices.length} ASSIGNED
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-muted/30 px-4 py-4">
        {assignedDevices.length > 0 ? (
          <div className="space-y-2">
            {assignedDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{device.name}</p>
                  <p className="truncate text-[11px] font-mono text-muted-foreground">{device.id}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.18em]',
                    device.lessonState.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : device.lessonState.status === 'completed'
                        ? 'bg-sky-500/10 text-sky-700'
                        : 'bg-amber-500/12 text-amber-700'
                  )}
                >
                  {device.lessonState.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No devices are currently assigned to this lesson.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row">
        <label className="min-w-0 flex-1">
          <span className="mb-2 block text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
            Device picker
          </span>
          <select
            value={selectedDeviceId}
            onChange={(event) => setSelectedDeviceId(event.target.value)}
            disabled={saving || unassignedDeviceOptions.length === 0}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {devices.length === 0
                ? 'No devices available'
                : unassignedDeviceOptions.length === 0
                  ? 'All devices already have this lesson'
                  : 'Choose a device'}
            </option>
            {unassignedDeviceOptions.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.status === 'online' ? 'online' : 'offline'})
              </option>
            ))}
          </select>
        </label>

        <div className="flex self-end">
          <Button
            type="button"
            onClick={() => void assignToDevice(selectedDeviceId)}
            disabled={!selectedDeviceId || saving}
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            Assign lesson
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Radio className="h-3.5 w-3.5" />
        Devices keep one assigned lesson at a time. Assigning here replaces that device&apos;s prior lesson.
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
