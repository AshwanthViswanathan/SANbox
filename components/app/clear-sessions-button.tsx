'use client'

import { startTransition, useState } from 'react'
import { Loader2, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

type ClearSessionsButtonProps = {
  sessionCount: number
}

export function ClearSessionsButton({ sessionCount }: ClearSessionsButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function clearSessions() {
    if (sessionCount === 0 || clearing) {
      return
    }

    setClearing(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/parent/sessions', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to clear sessions')
      }

      startTransition(() => {
        setConfirming(false)
        router.refresh()
      })
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'Unable to clear sessions right now.')
      setClearing(false)
    }
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => {
          setConfirming(true)
          setError(null)
        }}
        disabled={sessionCount === 0}
      >
        <Trash2 className="h-4 w-4" />
        Clear sessions
      </Button>
    )
  }

  return (
    <div className="w-full rounded-[1.5rem] border border-destructive/25 bg-destructive/5 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Verify clear sessions</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            This will permanently delete all {sessionCount} sessions in this SANbox account, including turn history.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (!clearing) {
              setConfirming(false)
              setError(null)
            }
          }}
          disabled={clearing}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setConfirming(false)
            setError(null)
          }}
          disabled={clearing}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void clearSessions()}
          disabled={clearing}
        >
          {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {clearing ? 'Clearing...' : 'Delete all sessions'}
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-xs leading-5 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
