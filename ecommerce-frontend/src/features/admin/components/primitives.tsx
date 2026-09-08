import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { Pagination, Sparkline } from '@/shared/ui'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-serif text-2xl text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-mute">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  spark,
  delta,
}: {
  label: string
  value: string
  hint?: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  spark?: number[]
  delta?: { value: string; positive: boolean }
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-caption uppercase tracking-wide text-ink-mute">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-ink-mute" />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-serif text-2xl text-ink">{value}</p>
        {spark && <Sparkline values={spark} />}
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-caption">
        {delta && (
          <span className={delta.positive ? 'text-success' : 'text-danger'}>
            {delta.positive ? '↑' : '↓'} {delta.value}
          </span>
        )}
        {hint && <span className="text-ink-mute">{hint}</span>}
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
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
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

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
  hideBelow?: 'sm' | 'md' | 'lg'
}

const hideClass = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }

export function DataTable<T>({
  rows,
  columns,
  keyOf,
  empty = 'Nothing here yet.',
  pageSize = 10,
}: {
  rows: T[]
  columns: Column<T>[]
  keyOf: (row: T) => string
  empty?: string
  pageSize?: number
}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-ink-mute">
        {empty}
      </div>
    )
  }

  const start = (current - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  return (
    <>
      {/* table on md+, stacked cards on mobile — scrolls sideways when columns overflow */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="w-full min-w-3xl text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-sunken/60 text-left text-caption uppercase tracking-wide text-ink-mute">
              {columns.map((col) => (
                <th key={col.header} className={cn('whitespace-nowrap px-4 py-3 font-medium', col.hideBelow && hideClass[col.hideBelow])}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={keyOf(row)} className="border-b border-border last:border-0 hover:bg-surface-sunken/40">
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={cn('px-4 py-3 text-ink-soft', col.className, col.hideBelow && hideClass[col.hideBelow])}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {pageRows.map((row) => (
          <div key={keyOf(row)} className="rounded-lg border border-border bg-surface p-4">
            {columns.map((col) => (
              <div key={col.header} className="flex justify-between gap-3 py-1 text-sm">
                <span className="text-caption uppercase tracking-wide text-ink-mute">{col.header}</span>
                <span className="text-right text-ink-soft">{col.cell(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-2.5">
        <p className="text-caption text-ink-mute">
          Showing <span className="text-ink-soft">{start + 1}–{Math.min(start + pageSize, rows.length)}</span> of{' '}
          <span className="text-ink-soft">{rows.length}</span>
        </p>
        <Pagination page={current} totalPages={totalPages} onChange={setPage} alwaysShow />
      </div>
    </>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
}
