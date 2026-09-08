import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LuChevronDown, LuCheck, LuSearch } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'
import { useClickOutside } from '@/shared/hooks/useClickOutside'

export interface SelectOption {
  value: string
  label: string
  hint?: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  /** show a filter box in the panel — auto-on above 7 options */
  searchable?: boolean
  size?: 'sm' | 'md'
  id?: string
  className?: string
  disabled?: boolean
  'aria-label'?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable,
  size = 'md',
  id,
  className,
  disabled,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const showSearch = searchable ?? options.length > 7
  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
  }, [query, options])

  useClickOutside(ref, () => setOpen(false), open)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(Math.max(0, filtered.findIndex((o) => o.value === value)))
      if (showSearch) setTimeout(() => searchRef.current?.focus(), 40)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const commit = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[active]
      if (opt) commit(opt.value)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setOpen(true)
          } else if (open) {
            onKey(e)
          }
        }}
        className={cn(
          'field-focus flex w-full items-center justify-between gap-2 rounded-md border border-border-strong bg-surface text-left outline-none transition-[border-color,box-shadow] duration-[var(--dur-1)] hover:border-ink-mute disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-9 px-3 text-caption' : 'h-11 px-3.5 text-sm',
          open && 'border-ink',
        )}
      >
        <span className={cn('truncate', selected ? 'text-ink' : 'text-ink-mute')}>
          {selected?.label ?? placeholder}
        </span>
        <LuChevronDown className={cn('h-4 w-4 shrink-0 text-ink-mute transition-transform duration-[var(--dur-1)]', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.14, ease: easeEditorial }}
            className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
          >
            {showSearch && (
              <div className="flex items-center gap-2 border-b border-border px-3">
                <LuSearch className="h-3.5 w-3.5 shrink-0 text-ink-mute" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActive(0)
                  }}
                  onKeyDown={onKey}
                  placeholder="Filter…"
                  className="h-9 w-full bg-transparent text-sm text-ink placeholder:text-ink-mute outline-none"
                />
              </div>
            )}
            <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-caption text-ink-mute">No matches</li>
              ) : (
                filtered.map((opt, i) => {
                  const isSelected = opt.value === value
                  return (
                    <li key={opt.value || '__empty'} role="option" aria-selected={isSelected} data-active={i === active}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => commit(opt.value)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors',
                          i === active ? 'bg-surface-sunken text-ink' : 'text-ink-soft',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{opt.label}</span>
                          {opt.hint && <span className="block truncate text-caption text-ink-mute">{opt.hint}</span>}
                        </span>
                        {isSelected && <LuCheck className="h-4 w-4 shrink-0 text-accent" />}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Convenience: build options from a list of strings. */
export function toOptions(values: string[]): SelectOption[] {
  return values.map((v) => ({ value: v, label: v }))
}
