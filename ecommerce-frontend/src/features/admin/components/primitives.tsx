import type { ComponentType, ReactNode, SVGProps } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { Sparkline } from '@/shared/ui'

export { DataTable, BulkButton, type Column, type RowAction, type Density, type SortState } from './DataTable'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {/* `!` beats the global unlayered h2 font rule in index.css */}
        <h2 className="font-display! text-[2rem] font-extrabold! leading-none tracking-[-0.04em]! text-ink [&_em]:font-medium [&_em]:text-accent">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-ink-mute">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}

/** White rounded card with an optional title row (title, subtitle, right-aligned aside). */
export function Panel({
  title,
  subtitle,
  aside,
  children,
  className,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-surface p-5 shadow-sm', className)}>
      {(title || aside) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display! text-base font-bold! tracking-[-0.01em]! text-ink">{title}</h3>
            )}
            {subtitle && <p className="mt-0.5 text-caption text-ink-mute">{subtitle}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  spark,
  delta,
  aside,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: ReactNode
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  spark?: number[]
  delta?: { value: string; positive: boolean }
  /** replaces the sparkline slot (avatars, a button…) */
  aside?: ReactNode
  tone?: 'default' | 'warning'
}) {
  const warn = tone === 'warning'
  return (
    <div
      className={cn(
        'h-full rounded-2xl border p-4 shadow-sm',
        warn ? 'border-warning/30! bg-warning-soft/50' : 'border-border bg-surface',
      )}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              warn ? 'bg-warning/15 text-warning' : 'bg-accent-soft text-accent',
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
        <p className="text-caption font-semibold text-ink-soft">{label}</p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              'font-display text-[1.9rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums',
              warn ? 'text-warning' : 'text-ink',
            )}
          >
            {value}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption">
            {delta && (
              <span className={cn('font-semibold', delta.positive ? 'text-success' : 'text-danger')}>
                {delta.positive ? '↑' : '↓'} {delta.value}
              </span>
            )}
            {hint && <span className={warn ? 'font-medium text-warning' : 'text-ink-mute'}>{hint}</span>}
          </p>
        </div>
        {aside ?? (spark && <Sparkline values={spark} className="mb-1 h-8 w-24 shrink-0" />)}
      </div>
    </div>
  )
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {children}
    </motion.div>
  )
}

export function FadeItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
}
