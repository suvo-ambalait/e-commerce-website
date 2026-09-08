import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export function Card({
  className,
  as: Tag = 'div',
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'article' | 'section'; interactive?: boolean }) {
  return (
    <Tag
      className={cn(
        'rounded-lg border border-border bg-surface',
        interactive && 'transition-shadow duration-[var(--dur-2)] hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 sm:p-6', className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between border-b border-border px-5 py-4 sm:px-6', className)}
      {...props}
    />
  )
}
