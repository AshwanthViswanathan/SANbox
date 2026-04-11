import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { SafeguardLabel, TeachBoxMode } from '@/shared/types'

export function SafeguardBadge({
  label,
  className,
}: {
  label: SafeguardLabel
  className?: string
}) {
  if (label === 'SAFE') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-emerald-700',
          className
        )}
      >
        <CheckCircle2 className="h-3 w-3" />
        SAFE
      </span>
    )
  }

  if (label === 'BORDERLINE') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-amber-700',
          className
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        BORDERLINE
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-destructive',
        className
      )}
    >
      <ShieldAlert className="h-3 w-3" />
      BLOCK
    </span>
  )
}

export function ModeBadge({
  mode,
  className,
}: {
  mode: TeachBoxMode
  className?: string
}) {
  const isLesson = mode === 'lesson'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.18em]',
        isLesson
          ? 'bg-accent/12 text-accent'
          : 'bg-sky-500/12 text-sky-700',
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      {isLesson ? 'LESSON MODE' : 'FREE CHAT'}
    </span>
  )
}
