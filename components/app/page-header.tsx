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
    <div className={cn('mb-8 flex items-start justify-between gap-4', className)}>
      <div>
        <div className="mb-1 flex items-center gap-3">
          <h1 className="stitch-heading text-3xl sm:text-4xl">{title}</h1>
          {badge && (
            <span className="stitch-pill bg-primary-container/20 text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
