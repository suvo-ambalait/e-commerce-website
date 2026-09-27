import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowLeft } from 'react-icons/lu'
import { AuthTitle } from './AuthLayout'

/**
 * Shared header for the password-recovery flow (forgot → verify → reset).
 * A back pill, an optional icon badge, a display title and a supporting line.
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
  title: ReactNode
  children?: ReactNode
}) {
  return (
    <div>
      <Link
        to={backTo}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-strong px-3 text-caption font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent"
      >
        <LuArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      {icon && (
        <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          {icon}
        </div>
      )}

      <div className="mt-5">
        <AuthTitle subtitle={children}>{title}</AuthTitle>
      </div>
    </div>
  )
}
