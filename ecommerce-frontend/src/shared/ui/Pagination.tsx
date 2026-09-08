import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
  alwaysShow = false,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
  alwaysShow?: boolean
}) {
  if (totalPages <= 1 && !alwaysShow) return null

  const pages = pageWindow(page, totalPages)

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <PageButton disabled={page === 1} onClick={() => onChange(page - 1)} label="Previous">
        <LuChevronLeft className="h-4 w-4" />
      </PageButton>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-ink-mute">
            …
          </span>
        ) : (
          <PageButton key={p} active={p === page} onClick={() => onChange(p)} label={`Page ${p}`}>
            {p}
          </PageButton>
        ),
      )}
      <PageButton disabled={page === totalPages} onClick={() => onChange(page + 1)} label="Next">
        <LuChevronRight className="h-4 w-4" />
      </PageButton>
    </nav>
  )
}

function PageButton({
  children,
  onClick,
  active,
  disabled,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-sm px-2 text-sm tabular-nums transition-colors disabled:opacity-30',
        active ? 'bg-ink text-bg' : 'text-ink-soft hover:bg-surface-sunken',
      )}
    >
      {children}
    </button>
  )
}

function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push('…')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < total - 1) out.push('…')
  out.push(total)
  return out
}
