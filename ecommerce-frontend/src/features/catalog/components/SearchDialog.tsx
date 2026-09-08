import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { formatPrice } from '@/shared/lib/format'
import { easeEditorial } from '@/shared/lib/motion'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { SearchIcon, CloseIcon, ArrowRightIcon } from '@/shared/ui/icons'
import { useCatalog } from '../context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { products, categories } = useCatalog()
  const { activeVendors } = useVendors()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 150)
  useScrollLock(open)

  useEffect(() => {
    if (open) {
      setQuery('')
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

  const productHits = useMemo(() => {
    if (!debounced) return []
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(debounced) ||
          p.category.toLowerCase().includes(debounced) ||
          p.materials.toLowerCase().includes(debounced) ||
          p.tags.some((t) => t.includes(debounced)),
      )
      .slice(0, 6)
  }, [debounced, products])

  const vendorHits = useMemo(() => {
    if (!debounced) return []
    return activeVendors
      .filter((v) => v.name.toLowerCase().includes(debounced) || v.tagline.toLowerCase().includes(debounced))
      .slice(0, 3)
  }, [debounced, activeVendors])

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  const submit = () => {
    const q = query.trim()
    if (q) go(`/search?q=${encodeURIComponent(q)}`)
  }

  const hasResults = productHits.length > 0 || vendorHits.length > 0

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-120 flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeEditorial }}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="relative flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="flex items-center gap-3 border-b border-border px-4"
            >
              <SearchIcon className="h-5 w-5 shrink-0 text-ink-mute" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search makers, materials and pieces…"
                className="h-14 flex-1 bg-transparent text-base text-ink placeholder:text-ink-mute outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="shrink-0 rounded-full p-1 text-ink-mute hover:text-ink"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </form>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {!debounced ? (
                <div className="p-4">
                  <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-mute">
                    Browse
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => go(`/shop?category=${encodeURIComponent(c.name)}`)}
                        className="rounded-full border border-border-strong px-3 py-1.5 text-caption text-ink-soft transition-colors hover:border-ink hover:text-ink"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !hasResults ? (
                <p className="px-4 py-10 text-center text-sm text-ink-mute">
                  Nothing matches “{debounced}”.
                </p>
              ) : (
                <div className="py-2">
                  {vendorHits.length > 0 && (
                    <Section label="Makers">
                      {vendorHits.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => go(`/vendor/${v.slug}`)}
                          className={rowClass}
                        >
                          <img src={v.logo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm text-ink">{v.name}</span>
                            <span className="block truncate text-caption text-ink-mute">{v.tagline}</span>
                          </span>
                        </button>
                      ))}
                    </Section>
                  )}

                  {productHits.length > 0 && (
                    <Section label="Pieces">
                      {productHits.map((p) => (
                        <Link key={p.id} to={`/product/${p.id}`} onClick={onClose} className={rowClass}>
                          <img src={p.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-sm object-cover" />
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm text-ink">{p.name}</span>
                            <span className="block text-caption text-ink-mute">{p.category}</span>
                          </span>
                          <span className="shrink-0 text-sm tabular-nums text-ink-soft">{formatPrice(p.price)}</span>
                        </Link>
                      ))}
                    </Section>
                  )}
                </div>
              )}
            </div>

            {debounced && (
              <button
                type="button"
                onClick={submit}
                className="flex items-center justify-between border-t border-border px-4 py-3 text-caption font-medium uppercase tracking-wide text-accent transition-colors hover:bg-surface-sunken"
              >
                Search for “{query.trim()}”
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const rowClass =
  'flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-sunken'

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 pb-1 pt-2 text-caption font-medium uppercase tracking-wide text-ink-mute">
        {label}
      </p>
      {children}
    </div>
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
