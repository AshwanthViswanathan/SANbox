import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  badge?: string
}

export function PageHeader({ title, description, action, className, badge }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {badge && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-accent/15 text-accent border border-accent/25">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
