import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuCheck, LuColumns3, LuDownload, LuFilter, LuPlus, LuRows3, LuRows4, LuX } from 'react-icons/lu'
import { Menu } from '@/shared/ui'
import { SearchIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import type { Density } from './DataTable'

/**
 * Building blocks for the admin/vendor table toolbars, shared so every table
 * reads like the Products table: search, status tabs with counts, density,
 * column picker, filters, pills, header buttons and CSV export.
 */

/* ------------------------------- layout ------------------------------- */

export function TableToolbar({ children, end }: { children: ReactNode; end?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {end && <div className="ml-auto flex flex-wrap items-center gap-2">{end}</div>}
    </div>
  )
}

export function TableSearch({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex h-9 w-full items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 focus-within:border-accent! focus-within:ring-4 focus-within:ring-accent/15 sm:w-60">
      <SearchIcon className="h-3.5 w-3.5 shrink-0 text-ink-mute" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-caption text-ink outline-none placeholder:text-ink-mute focus:ring-0"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="text-ink-mute hover:text-ink">
          <LuX className="h-3.5 w-3.5" />
        </button>
      )}
    </label>
  )
}

export function TableTabs<T extends string>({
  tabs,
  value,
  onChange,
  label = 'Filter',
}: {
  tabs: { value: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <div className="flex flex-wrap rounded-xl bg-surface-sunken p-1" role="tablist" aria-label={label}>
      {tabs.map((t) => {
        const on = value === t.value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-caption font-semibold transition-colors',
              on ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink',
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn('text-[11px] tabular-nums', on ? 'text-accent' : 'text-ink-mute')}>{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function ToolButton({
  onClick,
  active,
  icon,
  children,
}: {
  onClick: () => void
  active?: boolean
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-xl border bg-surface px-3 text-caption font-semibold text-ink transition-colors',
        active ? 'border-accent! text-accent' : 'border-border hover:border-accent/50!',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/* --------------------------- view preferences --------------------------- */

export function useTablePrefs(key: string, hiddenByDefault: string[] = []) {
  return usePersistedState<{ density: Density; hidden: string[] }>(`table:${key}`, {
    density: 'comfortable',
    hidden: hiddenByDefault,
  })
}

export function DensityToggle({ value, onChange }: { value: Density; onChange: (d: Density) => void }) {
  return (
    <div className="flex rounded-xl border border-border bg-surface p-0.5" role="group" aria-label="Row density">
      {(['comfortable', 'compact'] as Density[]).map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={value === d}
          aria-label={d === 'comfortable' ? 'Comfortable rows' : 'Compact rows'}
          onClick={() => onChange(d)}
          className={cn(
            'flex h-7 w-8 items-center justify-center rounded-lg transition-colors',
            value === d ? 'bg-accent-soft text-accent' : 'text-ink-mute hover:text-ink',
          )}
        >
          {d === 'comfortable' ? <LuRows3 className="h-4 w-4" /> : <LuRows4 className="h-4 w-4" />}
        </button>
      ))}
    </div>
  )
}

export function ColumnsMenu({
  options,
  hidden,
  onChange,
}: {
  options: { id: string; label: string }[]
  hidden: string[]
  onChange: (hidden: string[]) => void
}) {
  return (
    <Menu
      trigger={({ toggle, open }) => (
        <ToolButton onClick={toggle} active={open} icon={<LuColumns3 className="h-4 w-4" />}>
          Columns
        </ToolButton>
      )}
    >
      {() => (
        <div className="w-48 py-1">
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Show columns</p>
          {options.map(({ id, label }) => {
            const on = !hidden.includes(id)
            return (
              <button
                key={id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => onChange(on ? [...hidden, id] : hidden.filter((h) => h !== id))}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink-soft hover:bg-accent-soft hover:text-ink"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-[5px] border',
                    on ? 'border-accent! bg-accent text-on-accent' : 'border-border-strong',
                  )}
                >
                  {on && <LuCheck className="h-3 w-3" />}
                </span>
                {label}
              </button>
            )
          })}
        </div>
      )}
    </Menu>
  )
}

/** "Filters" button + popover. `children` renders the filter fields. */
export function FilterMenu({
  count,
  onClear,
  children,
}: {
  count: number
  onClear: () => void
  children: ReactNode
}) {
  return (
    <Menu
      trigger={({ toggle, open }) => (
        <ToolButton onClick={toggle} active={open || count > 0} icon={<LuFilter className="h-4 w-4" />}>
          Filters
          {count > 0 && (
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-on-accent">
              {count}
            </span>
          )}
        </ToolButton>
      )}
    >
      {() => (
        <div className="w-64 space-y-3 p-2">
          {children}
          {count > 0 && (
            <button type="button" onClick={onClear} className="text-caption font-semibold text-accent hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}
    </Menu>
  )
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-caption font-semibold text-ink">{label}</p>
      {children}
    </div>
  )
}

/* -------------------------------- pills -------------------------------- */

export type PillTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'muted' | 'outline'

const pillTone: Record<PillTone, string> = {
  neutral: 'bg-surface-sunken text-ink-soft',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  muted: 'bg-surface-sunken text-ink-mute',
  outline: 'border border-border bg-surface text-ink',
}

const dotTone: Record<PillTone, string> = {
  neutral: 'bg-ink-mute',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  muted: 'bg-border-strong',
  outline: 'bg-accent',
}

export function Pill({
  tone = 'neutral',
  dot,
  icon,
  children,
  className,
}: {
  tone?: PillTone
  dot?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-caption font-semibold',
        pillTone[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotTone[tone])} />}
      {icon}
      {children}
    </span>
  )
}

/** Plain category-style tag. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-md border border-border bg-surface-sunken/60 px-2 py-0.5 text-caption font-medium text-ink-soft">
      {children}
    </span>
  )
}

export function StockPill({ status, stock }: { status: 'in' | 'low' | 'out'; stock?: number }) {
  if (status === 'out')
    return (
      <Pill tone="danger" icon={<LuX className="h-3 w-3" />}>
        Out of stock
      </Pill>
    )
  if (status === 'low') return <Pill tone="warning">! Low{stock != null ? ` · ${stock} left` : ''}</Pill>
  return (
    <Pill tone="success" icon={<LuCheck className="h-3 w-3" />}>
      {stock != null ? `${stock} in stock` : 'In stock'}
    </Pill>
  )
}

/* --------------------------- header buttons --------------------------- */

export function ExportButton({ onClick, label = 'Export' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50!"
    >
      <LuDownload className="h-4 w-4" />
      {label}
    </button>
  )
}

export function PrimaryLink({ to, children, icon }: { to: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
    >
      {icon ?? <LuPlus className="h-4 w-4" />}
      {children}
    </Link>
  )
}

/* -------------------------------- export -------------------------------- */

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [header.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
