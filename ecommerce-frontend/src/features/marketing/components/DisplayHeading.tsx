import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@/shared/ui/icons'

/**
 * Section heading in the violet display style: dotted eyebrow, heavy display
 * title (wrap the accent words in <em>), optional description and pill link.
 */
export function DisplayHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: { to: string; label: string }
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {eyebrow}
        </p>
        {/* `!` beats the global unlayered h2 font rule in index.css */}
        <h2 className="mt-3 font-display! text-[clamp(2rem,1.4rem+2.6vw,3.25rem)] font-extrabold! leading-none tracking-[-0.04em]! text-ink [&_em]:font-medium [&_em]:text-accent">
          {title}
        </h2>
        {description && <p className="mt-3 text-sm text-ink-soft">{description}</p>}
      </div>

      {action && (
        <Link
          to={action.to}
          className="group inline-flex h-11 shrink-0 items-center gap-3 self-start rounded-full border border-border-strong bg-surface pl-5 pr-1.5 text-sm font-semibold text-ink transition-colors hover:border-accent sm:self-auto"
        >
          {action.label}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-bg transition-colors group-hover:bg-accent group-hover:text-on-accent">
            <ArrowRightIcon className="h-4 w-4" />
          </span>
        </Link>
      )}
    </div>
  )
}
