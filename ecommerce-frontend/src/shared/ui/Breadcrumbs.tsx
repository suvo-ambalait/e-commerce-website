import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1.5 text-caption text-ink-mute', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <Fragment key={i}>
            {item.to && !last ? (
              <Link to={item.to} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className={cn(last && 'text-ink-soft')} aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!last && <span className="text-border-strong">/</span>}
          </Fragment>
        )
      })}
    </nav>
  )
}
