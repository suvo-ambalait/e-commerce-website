import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed border-border-strong px-6 py-16 text-center',
        className,
      )}
    >
      {icon && <div className="mb-4 text-ink-mute [&_svg]:h-10 [&_svg]:w-10">{icon}</div>}
      <h3 className="text-lg text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-mute">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
