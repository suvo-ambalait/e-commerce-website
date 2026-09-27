import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'

/**
 * Page-level header in the violet display style: breadcrumbs, dotted eyebrow,
 * heavy display title (wrap accent words in <em>), description and an action.
 */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  crumbs?: Crumb[]
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between', crumbs && 'mt-5')}>
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {eyebrow}
            </p>
          )}
          {/* `!` beats the global unlayered h1 font rule in index.css */}
          <h1 className="font-display! text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] font-extrabold! leading-[1.02] tracking-[-0.04em]! text-ink text-balance [&_em]:font-medium [&_em]:text-accent">
            {title}
          </h1>
          {description && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
