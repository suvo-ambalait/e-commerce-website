import type { ElementType, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function Container({
  children,
  className,
  size = 'default',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  size?: 'narrow' | 'default' | 'wide'
  as?: ElementType
}) {
  const max = {
    narrow: 'max-w-3xl',
    default: 'max-w-7xl',
    wide: 'max-w-[88rem]',
  }[size]
  return <Tag className={cn('mx-auto w-full px-5 md:px-8', max, className)}>{children}</Tag>
}

export function Section({
  children,
  className,
  size = 'default',
  as: Tag = 'section',
  ...rest
}: {
  children: ReactNode
  className?: string
  size?: 'sm' | 'default' | 'lg'
  as?: ElementType
  id?: string
}) {
  const pad = {
    sm: 'py-9 md:py-12',
    default: 'py-12 md:py-16',
    lg: 'py-16 md:py-24',
  }[size]
  return (
    <Tag className={cn(pad, className)} {...rest}>
      {children}
    </Tag>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className="mb-2 text-caption font-medium uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        )}
        <h2 className="text-2xl text-ink text-balance">{title}</h2>
        {description && <p className="mt-3 text-sm text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
