import { cn } from '@/lib/utils'
import type { AgentStatus } from '@/lib/mock-data'

type RunStatus = 'success' | 'running' | 'failed' | 'queued'
type DeviceStatus = 'online' | 'offline' | 'warning'
type Level = 'info' | 'warn' | 'error' | 'debug'

type Status = AgentStatus | RunStatus | DeviceStatus | Level

const statusConfig: Record<Status, { dot: string; text: string; label: string }> = {
  // Agent
  running: { dot: 'bg-accent animate-pulse', text: 'text-accent', label: 'Running' },
  idle: { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', label: 'Idle' },
  error: { dot: 'bg-destructive', text: 'text-destructive', label: 'Error' },
  paused: { dot: 'bg-yellow-500/60', text: 'text-yellow-600', label: 'Paused' },
  // Run
  success: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Success' },
  failed: { dot: 'bg-destructive', text: 'text-destructive', label: 'Failed' },
  queued: { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', label: 'Queued' },
  // Device
  online: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Online' },
  offline: { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', label: 'Offline' },
  warning: { dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'Warning' },
  // Log level
  info: { dot: 'bg-accent', text: 'text-accent', label: 'INFO' },
  warn: { dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'WARN' },
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
