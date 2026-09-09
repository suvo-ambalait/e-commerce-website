import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowLeft } from 'react-icons/lu'

/**
 * Shared header for the password-recovery flow (forgot → verify → reset).
 * A back link, an optional icon badge, a title and a supporting line.
 */
export function AuthIntro({
  backTo,
  backLabel = 'Back',
  icon,
  title,
  children,
}: {
  backTo: string
  backLabel?: string
  icon?: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div>
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-caption text-ink-mute transition-colors hover:text-ink"
      >
        <LuArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {icon && (
        <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-sunken text-ink-soft">
          {icon}
        </div>
      )}

      <h1 className="mt-5 text-2xl text-ink">{title}</h1>
      {children && <p className="mt-2 text-sm text-ink-soft">{children}</p>}
    </div>
  )
}
