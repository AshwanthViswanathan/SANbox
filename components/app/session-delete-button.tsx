'use client'

import { startTransition, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SessionDeleteButtonProps = {
  sessionId: string
  sessionLabel?: string
  redirectHref?: string
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
  className?: string
  buttonClassName?: string
}

export function SessionDeleteButton({
  sessionId,
  sessionLabel,
  redirectHref,
  size = 'sm',
  className,
  buttonClassName,
}: SessionDeleteButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteSession() {
    const confirmed = window.confirm(
      `Delete ${sessionLabel ?? sessionId}? This removes the session from the dashboard and deletes its turn history.`
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/parent/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to delete session')
      }

      startTransition(() => {
        if (redirectHref) {
          router.push(redirectHref)
        }

        router.refresh()
      })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete session right now.')
      setDeleting(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        type="button"
        variant="destructive"
        size={size}
        className={cn('w-full', buttonClassName)}
        onClick={() => void deleteSession()}
        disabled={deleting}
      >
        <Trash2 className="h-4 w-4" />
        {deleting ? 'Deleting...' : 'Delete session'}
      </Button>

      {error && (
        <p className="text-xs leading-5 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
