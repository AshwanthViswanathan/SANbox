'use client'

import { startTransition, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FlagDeleteButtonProps = {
  sessionId: string
  turnId: string
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
  className?: string
  buttonClassName?: string
}

export function FlagDeleteButton({
  sessionId,
  turnId,
  size = 'icon-sm',
  className,
  buttonClassName,
}: FlagDeleteButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteFlaggedTurn() {
    const confirmed = window.confirm(
      'Delete this flagged moment? This removes the turn from the session history and review queue.'
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/parent/sessions/${sessionId}/turns/${turnId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to delete flagged turn')
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete flag right now.')
      setDeleting(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        type="button"
        variant="destructive"
        size={size}
        className={cn(buttonClassName)}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void deleteFlaggedTurn()
        }}
        disabled={deleting}
        aria-label="Delete flagged turn"
      >
        <Trash2 className="h-4 w-4" />
        {size !== 'icon' && size !== 'icon-sm' && size !== 'icon-lg' && (
          <span>{deleting ? 'Deleting...' : 'Delete flag'}</span>
        )}
      </Button>

      {error && (
        <p className="text-xs leading-5 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
