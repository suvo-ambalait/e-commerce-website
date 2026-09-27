import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LuArrowDown, LuArrowUp, LuArrowUpDown, LuCheck, LuEllipsisVertical, LuMinus, LuX } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { Pagination, Select } from '@/shared/ui'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  /** stable key for sorting / column visibility (defaults to `header`) */
  id?: string
  className?: string
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** makes the header clickable to sort by this value */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
}

export interface RowAction<T> {
  label: string
  icon?: Icon
  onClick: (row: T) => void
  danger?: boolean
  hidden?: (row: T) => boolean
}

export type Density = 'comfortable' | 'compact'
export type SortState = { id: string; dir: 'asc' | 'desc' }

const hideClass = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
  '2xl': 'hidden 2xl:table-cell',
}
const colId = <T,>(c: Column<T>) => c.id ?? c.header

/**
 * Admin data table: one rounded card holding an optional toolbar, the table
 * (stacked cards on mobile), and a footer with rows-per-page + pagination.
 * Optional: row selection with a floating bulk bar, sortable columns, a ⋯ row
 * menu, hidden columns and compact density.
 */
export function DataTable<T>({
  rows,
  columns,
  keyOf,
  empty = 'Nothing here yet.',
  pageSize: initialPageSize = 10,
  pageSizeOptions = [6, 10, 20, 50],
  toolbar,
  selectable = false,
  selected: controlledSelected,
  onSelectedChange,
  rowActions,
  hiddenColumns = [],
  density = 'comfortable',
  defaultSort,
  bulkBar,
}: {
  rows: T[]
  columns: Column<T>[]
  keyOf: (row: T) => string
  empty?: ReactNode
  pageSize?: number
  pageSizeOptions?: number[]
  toolbar?: ReactNode
  selectable?: boolean
  selected?: string[]
  onSelectedChange?: (keys: string[]) => void
  rowActions?: RowAction<T>[]
  hiddenColumns?: string[]
  density?: Density
  defaultSort?: SortState
  /** contents of the floating dark bar shown while rows are selected */
  bulkBar?: (keys: string[], clear: () => void) => ReactNode
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sort, setSort] = useState<SortState | undefined>(defaultSort)
  const [innerSelected, setInnerSelected] = useState<string[]>([])
  const selected = controlledSelected ?? innerSelected
  const setSelected = (keys: string[]) => (onSelectedChange ?? setInnerSelected)(keys)

  const visible = columns.filter((c) => !hiddenColumns.includes(colId(c)))

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => colId(c) === sort.id)
    if (!col?.sortValue) return rows
    const get = col.sortValue
    const dir = sort!.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const x = get(a)
      const y = get(b)
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir
    })
  }, [rows, columns, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, totalPages)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // drop selections for rows that disappeared (filtered out / deleted)
  const rowKeys = useMemo(() => new Set(rows.map(keyOf)), [rows, keyOf])
  useEffect(() => {
    if (selected.some((k) => !rowKeys.has(k))) setSelected(selected.filter((k) => rowKeys.has(k)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowKeys])

  const start = (current - 1) * pageSize
  const pageRows = sorted.slice(start, start + pageSize)
  const pageKeys = pageRows.map(keyOf)
  const allOnPage = pageKeys.length > 0 && pageKeys.every((k) => selected.includes(k))
  const someOnPage = pageKeys.some((k) => selected.includes(k))

  const toggleRow = (k: string) =>
    setSelected(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k])
  const togglePage = () =>
    setSelected(allOnPage ? selected.filter((k) => !pageKeys.includes(k)) : [...new Set([...selected, ...pageKeys])])

  const onSort = (c: Column<T>) => {
    if (!c.sortValue) return
    const id = colId(c)
    setSort((s) => (s?.id === id ? { id, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { id, dir: 'asc' }))
  }

  const cellPad = density === 'compact' ? 'px-3 py-2' : 'px-3 py-3.5'
  const showActions = Boolean(rowActions?.length)

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {toolbar && <div className="border-b border-border p-3">{toolbar}</div>}

        {rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-mute">{empty}</div>
        ) : (
          <>
            {/* table on md+ */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-3xl text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken/50 text-left text-caption text-ink-mute">
                    {selectable && (
                      <th className="w-10 py-3 pl-4">
                        <CheckBox checked={allOnPage} mixed={!allOnPage && someOnPage} onChange={togglePage} label="Select page" />
                      </th>
                    )}
                    {visible.map((col) => {
                      const id = colId(col)
                      const active = sort?.id === id
                      return (
                        <th
                          key={id}
                          aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                          className={cn(
                            'whitespace-nowrap px-3 py-3 font-semibold',
                            col.align === 'right' && 'text-right',
                            col.hideBelow && hideClass[col.hideBelow],
                          )}
                        >
                          {col.sortValue ? (
                            <button
                              type="button"
                              onClick={() => onSort(col)}
                              className={cn(
                                'inline-flex items-center gap-1 transition-colors hover:text-ink',
                                active && 'text-ink',
                                col.align === 'right' && 'flex-row-reverse',
                              )}
                            >
                              {col.header}
                              {active ? (
                                sort!.dir === 'asc' ? <LuArrowUp className="h-3 w-3 text-accent" /> : <LuArrowDown className="h-3 w-3 text-accent" />
                              ) : (
                                <LuArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                          ) : (
                            col.header
                          )}
                        </th>
                      )
                    })}
                    {showActions && <th className="w-12" aria-label="Actions" />}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => {
                    const k = keyOf(row)
                    const isSel = selected.includes(k)
                    return (
                      <tr
                        key={k}
                        className={cn(
                          'border-b border-border transition-colors last:border-0',
                          isSel ? 'bg-accent-soft/50' : 'hover:bg-surface-sunken/60',
                        )}
                      >
                        {selectable && (
                          <td className="py-2 pl-4">
                            <CheckBox checked={isSel} onChange={() => toggleRow(k)} label="Select row" />
                          </td>
                        )}
                        {visible.map((col) => (
                          <td
                            key={colId(col)}
                            className={cn(
                              cellPad,
                              'text-ink-soft',
                              col.align === 'right' && 'text-right',
                              col.className,
                              col.hideBelow && hideClass[col.hideBelow],
                            )}
                          >
                            {col.cell(row)}
                          </td>
                        ))}
                        {showActions && (
                          <td className="pr-3 text-right">
                            <RowMenu row={row} actions={rowActions!} />
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* stacked cards on mobile */}
            <div className="divide-y divide-border md:hidden">
              {pageRows.map((row) => {
                const k = keyOf(row)
                return (
                  <div key={k} className={cn('p-4', selected.includes(k) && 'bg-accent-soft/50')}>
                    {(selectable || showActions) && (
                      <div className="mb-2 flex items-center justify-between">
                        {selectable ? (
                          <CheckBox checked={selected.includes(k)} onChange={() => toggleRow(k)} label="Select row" />
                        ) : (
                          <span />
                        )}
                        {showActions && <RowMenu row={row} actions={rowActions!} />}
                      </div>
                    )}
                    {visible.map((col) => (
                      <div key={colId(col)} className="flex items-center justify-between gap-3 py-1 text-sm">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{col.header}</span>
                        <span className="min-w-0 text-right text-ink-soft">{col.cell(row)}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
              <div className="flex items-center gap-2 text-caption text-ink-mute">
                Rows per page
                <Select
                  size="sm"
                  aria-label="Rows per page"
                  value={String(pageSize)}
                  onChange={(v) => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                  options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
                  className="w-18"
                />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-caption text-ink-mute tabular-nums">
                  {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
                </p>
                <Pagination page={current} totalPages={totalPages} onChange={setPage} alwaysShow />
              </div>
            </div>
          </>
        )}
      </div>

      {/* floating bulk bar */}
      <AnimatePresence>
        {bulkBar && selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 16, x: '-50%' }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 left-1/2 z-60 flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-2xl bg-[#0b0a10] p-1.5 pl-4 text-white shadow-[0_20px_50px_rgba(11,10,16,0.35)]"
            role="toolbar"
            aria-label="Bulk actions"
          >
            <span className="mr-2 whitespace-nowrap text-sm font-bold tabular-nums">{selected.length} selected</span>
            {bulkBar(selected, () => setSelected([]))}
            <button
              type="button"
              onClick={() => setSelected([])}
              aria-label="Clear selection"
              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
            >
              <LuX className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/** Button styled for the dark bulk bar. */
export function BulkButton({
  icon: Ico,
  children,
  onClick,
  danger,
  disabled,
}: {
  icon?: Icon
  children: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-white/10 disabled:opacity-40',
        danger && 'text-[#f08a9b]',
      )}
    >
      {Ico && <Ico className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

function CheckBox({
  checked,
  mixed,
  onChange,
  label,
}: {
  checked: boolean
  mixed?: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? 'mixed' : checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'flex h-4.5 w-4.5 items-center justify-center rounded-[5px] border transition-colors',
        checked || mixed ? 'border-accent! bg-accent text-on-accent' : 'border-border-strong bg-surface hover:border-accent!',
      )}
    >
      {checked ? <LuCheck className="h-3 w-3" /> : mixed ? <LuMinus className="h-3 w-3" /> : null}
    </button>
  )
}

/** ⋯ menu rendered in a fixed-position portal so the table's overflow can't clip it. */
function RowMenu<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const [pos, setPos] = useState<{ top: number; right: number; up: boolean } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const items = actions.filter((a) => !a.hidden?.(row))
  const isOpen = pos !== null

  useEffect(() => {
    if (!isOpen) return
    const close = (e: Event) => {
      if (e.type === 'mousedown' && (panel.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node))) return
      setPos(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPos(null)
    // keep the panel pinned to its button while the page or table scrolls
    const follow = () => {
      const r = btn.current?.getBoundingClientRect()
      if (!r) return setPos(null)
      setPos((p) => (p ? { ...p, top: p.up ? r.top - 6 : r.bottom + 6, right: window.innerWidth - r.right } : p))
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', follow, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', follow, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  const open = () => {
    const r = btn.current!.getBoundingClientRect()
    const up = window.innerHeight - r.bottom < 60 + items.length * 40
    setPos({ top: up ? r.top - 6 : r.bottom + 6, right: window.innerWidth - r.right, up })
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={() => (pos ? setPos(null) : open())}
        aria-label="Row actions"
        aria-expanded={Boolean(pos)}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg border text-ink-soft transition-colors',
          pos ? 'border-accent! bg-accent-soft text-accent' : 'border-transparent hover:border-border hover:text-ink',
        )}
      >
        <LuEllipsisVertical className="h-4 w-4" />
      </button>
      {pos &&
        createPortal(
          <div
            ref={panel}
            role="menu"
            className="fixed z-130 min-w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
            style={{ top: pos.top, right: pos.right, transform: pos.up ? 'translateY(-100%)' : undefined }}
          >
            {items.map((a, i) => (
              <div key={a.label}>
                {a.danger && i > 0 && <div className="my-1 border-t border-border" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPos(null)
                    a.onClick(row)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
                    a.danger ? 'text-danger hover:bg-danger-soft' : 'text-ink-soft hover:bg-accent-soft hover:text-ink',
                  )}
                >
                  {a.icon && <a.icon className="h-4 w-4" />}
                  {a.label}
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
