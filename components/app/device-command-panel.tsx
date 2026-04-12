'use client'

import { startTransition, useEffect, useState } from 'react'
import {
  Mic,
  MicOff,
  PauseCircle,
  PlayCircle,
  Power,
  PowerOff,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  parentDeviceControlResponseSchema,
  type ParentDeviceControlState,
} from '@/shared/api'

type DeviceCommandPanelProps = {
  deviceId: string
  deviceName: string
  isOnline: boolean
}

const DEFAULT_STATE: ParentDeviceControlState = {
  device: 'active',
  microphone: 'on',
  speaker: 'on',
}

export function DeviceCommandPanel({
  deviceId,
  deviceName,
  isOnline,
}: DeviceCommandPanelProps) {
  const router = useRouter()
  const [controlState, setControlState] = useState<ParentDeviceControlState>(DEFAULT_STATE)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadControls() {
      try {
        const response = await fetch(`/api/v1/parent/devices/${deviceId}/control`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to load device controls')
        }

        const payload = parentDeviceControlResponseSchema.parse(await response.json())

        if (!active) return
        setControlState(payload.controls)
        setError(null)
      } catch {
        if (!active) return
        setError('Unable to load live control state.')
      } finally {
        if (active) {
          setReady(true)
        }
      }
    }

    void loadControls()

    return () => {
      active = false
    }
  }, [deviceId])

  async function persistState(nextState: ParentDeviceControlState) {
    setControlState(nextState)
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/parent/devices/${deviceId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          controls: nextState,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update device controls')
      }

      const payload = parentDeviceControlResponseSchema.parse(await response.json())
      setControlState(payload.controls)
    } catch {
      setError('Unable to save parent controls right now.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteDevice() {
    const confirmed = window.confirm(
      `Delete ${deviceName}? This will remove the device and its recorded sessions from the dashboard.`
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/parent/devices/${deviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to delete device')
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to delete device right now.')
      setDeleting(false)
      return
    }
  }

  const paused = controlState.device === 'paused'
  const poweredOff = controlState.device === 'off'
  const microphoneOff = controlState.microphone === 'off'
  const speakerOff = controlState.speaker === 'off'
  const disabled = !ready || saving || deleting

  return (
    <div className="rounded-[1.25rem] border border-border bg-background px-4 py-4 sm:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Parent controls</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Calls the parent device-control API and stays separate from the child turn endpoint.
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.18em]',
            paused
              ? 'bg-amber-500/12 text-amber-700'
              : poweredOff
                ? 'bg-destructive/10 text-destructive'
                : 'bg-emerald-500/10 text-emerald-700'
          )}
        >
          {saving ? 'SAVING' : paused ? 'PAUSED' : poweredOff ? 'OFF' : 'ACTIVE'}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant={paused ? 'default' : 'outline'}
          className="h-auto min-h-10 whitespace-normal px-3 py-2 text-center leading-5"
          onClick={() =>
            void persistState({
              ...controlState,
              device: paused ? 'active' : 'paused',
            })
          }
          disabled={disabled || poweredOff}
        >
          {paused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
          {paused ? 'Resume device' : 'Pause device'}
        </Button>

        <Button
          type="button"
          variant={poweredOff ? 'default' : 'outline'}
          className="h-auto min-h-10 whitespace-normal px-3 py-2 text-center leading-5"
          onClick={() =>
            void persistState({
              ...controlState,
              device: poweredOff ? 'active' : 'off',
            })
          }
          disabled={disabled}
        >
          {poweredOff ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
          {poweredOff ? 'Turn device back on' : 'Turn off device'}
        </Button>

        <Button
          type="button"
          variant={microphoneOff ? 'default' : 'outline'}
          className="h-auto min-h-10 whitespace-normal px-3 py-2 text-center leading-5"
          onClick={() =>
            void persistState({
              ...controlState,
              microphone: microphoneOff ? 'on' : 'off',
            })
          }
          disabled={disabled || poweredOff}
        >
          {microphoneOff ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {microphoneOff ? 'Turn microphone on' : 'Turn microphone off'}
        </Button>

        <Button
          type="button"
          variant={speakerOff ? 'default' : 'outline'}
          className="h-auto min-h-10 whitespace-normal px-3 py-2 text-center leading-5"
          onClick={() =>
            void persistState({
              ...controlState,
              speaker: speakerOff ? 'on' : 'off',
            })
          }
          disabled={disabled || poweredOff}
        >
          {speakerOff ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {speakerOff ? 'Turn speaker on' : 'Turn speaker off'}
        </Button>
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={() => void deleteDevice()}
          disabled={deleting || saving}
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Deleting device...' : 'Delete device'}
        </Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <ControlStatus label="Microphone" value={microphoneOff ? 'Off' : 'On'} muted={microphoneOff} />
        <ControlStatus label="Speaker" value={speakerOff ? 'Off' : 'On'} muted={speakerOff} />
        <ControlStatus label="Device" value={paused ? 'Paused' : poweredOff ? 'Off' : 'Active'} muted={poweredOff} />
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-destructive/8 px-3 py-3 text-xs leading-5 text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-muted/35 px-3 py-3 text-xs leading-5 text-muted-foreground">
        {poweredOff
          ? `${deviceName} is marked off in the SANbox dashboard. The child device should appear unavailable in the demo until you turn it back on.`
          : paused
            ? `${deviceName} is marked paused. Use this to show that a parent can temporarily stop new child interactions without changing the turn API.`
            : microphoneOff && speakerOff
              ? `${deviceName} is still online, but both microphone and speaker are marked off for the demo.`
              : microphoneOff
                ? `${deviceName} is active, but the microphone is marked off so the child cannot start a new voice turn in the demo.`
                : speakerOff
                  ? `${deviceName} is active, but the speaker is marked off so SANbox replies should appear muted in the demo.`
                  : isOnline
                    ? `${deviceName} is active and ready for button-to-talk sessions.`
                    : `${deviceName} is offline right now, but you can still stage a paused or off state for the demo.`}
      </div>
    </div>
  )
}

function ControlStatus({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="rounded-2xl bg-muted/25 px-3 py-2">
      <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold', muted ? 'text-destructive' : 'text-foreground')}>
        {value}
      </p>
    </div>
  )
}
