import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'sale' | 'inverse'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-soft',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  sale: 'bg-sale text-white',
  inverse: 'bg-ink text-bg',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Tag({
  children,
  active,
  className,
  ...props
}: {
  children: ReactNode
  active?: boolean
  className?: string
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-caption transition-colors',
        active ? 'border-transparent bg-ink text-bg' : 'border-border-strong text-ink-soft hover:border-ink',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
