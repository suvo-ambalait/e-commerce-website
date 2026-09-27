import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LuArrowDown, LuArrowUp, LuCornerDownLeft, LuLayers } from 'react-icons/lu'
import { formatPrice } from '@/shared/lib/format'
import { easeEditorial } from '@/shared/lib/motion'
import { cn } from '@/shared/lib/cn'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { SearchIcon, CloseIcon, ArrowRightIcon } from '@/shared/ui/icons'
import { useCatalog } from '../context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'

type Tab = 'all' | 'pieces' | 'makers' | 'categories'

interface Hit {
  key: string
  group: Exclude<Tab, 'all'>
  to: string
  image?: string
  round?: boolean
  title: string
  subtitle: string
  aside?: string
}

const groupLabels: Record<Hit['group'], string> = { pieces: 'Pieces', makers: 'Makers', categories: 'Categories' }

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { products, categories } = useCatalog()
  const { activeVendors, getVendor } = useVendors()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 150)
  useScrollLock(open)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTab('all')
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const hits = useMemo<Hit[]>(() => {
    if (!debounced) return []
    const pieces: Hit[] = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(debounced) ||
          p.category.toLowerCase().includes(debounced) ||
          p.materials.toLowerCase().includes(debounced) ||
          p.tags.some((t) => t.includes(debounced)),
      )
      .slice(0, 6)
      .map((p) => ({
        key: `p-${p.id}`,
        group: 'pieces',
        to: `/product/${p.id}`,
        image: p.images[0],
        title: p.name,
        subtitle: [p.category, getVendor(p.vendorId)?.name].filter(Boolean).join(' · '),
        aside: formatPrice(p.price),
      }))
    const makers: Hit[] = activeVendors
      .filter((v) => v.name.toLowerCase().includes(debounced) || v.tagline.toLowerCase().includes(debounced))
      .slice(0, 3)
      .map((v) => ({
        key: `v-${v.id}`,
        group: 'makers',
        to: `/vendor/${v.slug}`,
        image: v.logo,
        round: true,
        title: v.name,
        subtitle: `${v.location} · ${v.tagline}`,
      }))
    const cats: Hit[] = categories
      .filter((c) => c.name.toLowerCase().includes(debounced) || c.description.toLowerCase().includes(debounced))
      .slice(0, 4)
      .map((c) => ({
        key: `c-${c.id}`,
        group: 'categories',
        to: `/shop?category=${encodeURIComponent(c.name)}`,
        image: c.image,
        title: c.name,
        subtitle: c.description,
        aside: `${products.filter((p) => p.category === c.name).length} pieces`,
      }))
    return [...pieces, ...makers, ...cats]
  }, [debounced, products, activeVendors, categories, getVendor])

  const counts = {
    all: hits.length,
    pieces: hits.filter((h) => h.group === 'pieces').length,
    makers: hits.filter((h) => h.group === 'makers').length,
    categories: hits.filter((h) => h.group === 'categories').length,
  }
  const shown = tab === 'all' ? hits : hits.filter((h) => h.group === tab)

  // reset the highlighted row whenever the result set changes
  useEffect(() => setActive(0), [debounced, tab])

  // keep the highlighted row in view
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  const searchAll = () => {
    const q = query.trim()
    if (q) go(`/search?q=${encodeURIComponent(q)}`)
  }

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && shown.length) {
      e.preventDefault()
      setActive((i) => (i + 1) % shown.length)
    } else if (e.key === 'ArrowUp' && shown.length) {
      e.preventDefault()
      setActive((i) => (i - 1 + shown.length) % shown.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (shown[active]) go(shown[active].to)
      else searchAll()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-120 flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0b0a10]/45 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeEditorial }}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="relative flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_30px_80px_rgba(40,20,80,0.25)]"
          >
            {/* search field */}
            <div className="p-3">
              <div className="flex h-14 items-center gap-3 rounded-2xl border-2 border-accent! bg-surface pl-4 pr-2 ring-4 ring-accent/10">
                <SearchIcon className="h-5 w-5 shrink-0 text-accent" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder="Search pieces, makers and materials…"
                  aria-label="Search"
                  role="combobox"
                  aria-expanded={shown.length > 0}
                  aria-controls="search-results"
                  aria-activedescendant={shown[active] ? `search-hit-${active}` : undefined}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-mute focus:ring-0"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      inputRef.current?.focus()
                    }}
                    className="h-8 shrink-0 rounded-full bg-surface-sunken px-3 text-caption font-semibold text-ink-soft transition-colors hover:text-ink"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-bg transition-opacity hover:opacity-85"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              {debounced && (
                <div className="mt-3 flex gap-1 overflow-x-auto" role="tablist" aria-label="Result type">
                  {(['all', 'pieces', 'makers', 'categories'] as Tab[]).map((t) => {
                    const on = tab === t
                    return (
                      <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => {
                          setTab(t)
                          inputRef.current?.focus()
                        }}
                        className={cn(
                          'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-caption font-semibold transition-colors',
                          on ? 'bg-ink text-bg' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                        )}
                      >
                        {t === 'all' ? 'All' : groupLabels[t]}
                        <span className={cn('tabular-nums', on ? 'text-[#a78bfa]' : 'text-ink-mute')}>{counts[t]}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div ref={listRef} id="search-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto border-t border-border">
              {!debounced ? (
                <div className="p-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Browse categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => go(`/shop?category=${encodeURIComponent(c.name)}`)}
                        className="flex h-9 items-center gap-2 rounded-full border border-border-strong pl-1 pr-3.5 text-caption font-semibold text-ink-soft transition-colors hover:border-accent! hover:text-accent"
                      >
                        <img src={c.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : shown.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <SearchIcon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 font-display text-lg font-bold text-ink">Nothing matches “{query.trim()}”</p>
                  <p className="mt-1 text-sm text-ink-mute">Try a material like “oak” or a maker’s name.</p>
                </div>
              ) : (
                <div className="p-2">
                  {shown.map((hit, i) => (
                    <Fragment key={hit.key}>
                      {(i === 0 || shown[i - 1].group !== hit.group) && (
                        <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                          {groupLabels[hit.group]}
                        </p>
                      )}
                      <button
                        type="button"
                        id={`search-hit-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={i === active}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(hit.to)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors',
                          i === active ? 'bg-accent-soft' : 'hover:bg-surface-sunken',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-surface-sunken',
                            hit.round ? 'rounded-full' : 'rounded-xl',
                          )}
                        >
                          {hit.image ? (
                            <img src={hit.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <LuLayers className="h-5 w-5 text-accent" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[15px] font-bold tracking-[-0.01em] text-ink">
                            <Highlight text={hit.title} query={debounced} />
                          </span>
                          <span className="block truncate text-caption text-ink-mute">{hit.subtitle}</span>
                        </span>
                        {hit.aside && (
                          <span className="shrink-0 font-display text-[15px] font-bold text-ink tabular-nums">{hit.aside}</span>
                        )}
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent transition-opacity',
                            i === active ? 'opacity-100' : 'opacity-0',
                          )}
                          aria-hidden
                        >
                          <LuCornerDownLeft className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-sunken/60 px-4 py-3">
              {debounced ? (
                <button
                  type="button"
                  onClick={searchAll}
                  className="flex min-w-0 items-center gap-1.5 text-caption font-semibold text-accent hover:underline"
                >
                  <span className="truncate">See all results for “{query.trim()}”</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 shrink-0" />
                </button>
              ) : (
                <span className="text-caption text-ink-mute">Type to search the whole marketplace</span>
              )}
              <div className="hidden items-center gap-3 text-caption text-ink-mute sm:flex">
                <KeyHint keys={[<LuArrowUp key="u" />, <LuArrowDown key="d" />]}>Move</KeyHint>
                <KeyHint keys={[<LuCornerDownLeft key="e" />]}>Open</KeyHint>
                <KeyHint keys={['esc']}>Close</KeyHint>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Wraps every case-insensitive occurrence of `query` in a violet mark. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const lower = text.toLowerCase()
  const parts: ReactNode[] = []
  let from = 0
  let at = lower.indexOf(query)
  while (at !== -1) {
    if (at > from) parts.push(text.slice(from, at))
    parts.push(
      <mark key={at} className="rounded bg-accent/15 px-0.5 text-accent">
        {text.slice(at, at + query.length)}
      </mark>,
    )
    from = at + query.length
    at = lower.indexOf(query, from)
  }
  parts.push(text.slice(from))
  return <>{parts}</>
}

function KeyHint({ keys, children }: { keys: ReactNode[]; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="flex h-5 min-w-5 items-center justify-center rounded-md border border-border-strong bg-surface px-1 font-sans text-[10px] font-semibold text-ink-soft [&>svg]:h-3 [&>svg]:w-3"
          >
            {k}
          </kbd>
        ))}
      </span>
      {children}
    </span>
  )
}

/** Global Cmd/Ctrl+K → opens search. */
export function useSearchHotkey(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpen])
}
