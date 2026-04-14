import { cn } from '@/lib/utils'

type DeviceStatus = 'online' | 'offline' | 'warning'
type Level = 'info' | 'warn' | 'error' | 'debug'

export type Status = DeviceStatus | Level

const statusConfig: Record<Status, { dot: string; text: string; label: string }> = {
  // Device
  online: { dot: 'bg-primary', text: 'text-primary', label: 'Online' },
  offline: { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', label: 'Offline' },
  warning: { dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'Warning' },
  // Log level
  info: { dot: 'bg-accent', text: 'text-accent', label: 'INFO' },
  warn: { dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'WARN' },
  error: { dot: 'bg-destructive', text: 'text-destructive', label: 'ERROR' },
  debug: { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', label: 'DEBUG' },
}

interface StatusBadgeProps {
  status: Status
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { dot: 'bg-border', text: 'text-muted-foreground', label: status }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-mono', config.text, className)}>
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      {config.label}
    </span>
  )
}
