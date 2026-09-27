import { useState, type ReactNode } from 'react'
import { LuSlidersHorizontal } from 'react-icons/lu'
import { Avatar } from '@/shared/ui'
import { ArrowRightIcon, CheckIcon, CloseIcon, StarIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { formatPriceWhole } from '@/shared/lib/format'
import { useCatalog } from '../context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Product } from '@/shared/types'
import type { useProductQuery } from '../lib/useProductQuery'

type Query = ReturnType<typeof useProductQuery>

const ratings = [4.5, 4, 3.5]
const commonTags = ['bestseller', 'new', 'brass', 'wool', 'linen', 'gift', 'set']
const titleCase = (t: string) => t[0].toUpperCase() + t.slice(1)

/**
 * Filter card: header with active count + chips, then Category / Maker / Price /
 * Rating / Details sections. `products` is the pool the counts are taken from.
 */
export function FilterPanel({
  query,
  products,
  hideVendors = false,
  hideCategories = false,
  onClose,
  onShowResults,
  className,
}: {
  query: Query
  products: Product[]
  hideVendors?: boolean
  hideCategories?: boolean
  /** shows a close button in the header (drawer use) */
  onClose?: () => void
  /** shows the purple "Show results" footer button (drawer use) */
  onShowResults?: () => void
  className?: string
}) {
  const { filters, update, reset, activeCount, priceCeiling, priceFloor } = query
  const { categories } = useCatalog()
  const { activeVendors, getVendor } = useVendors()

  const toggle = (key: 'categories' | 'vendorIds' | 'tags', value: string) => {
    const list = filters[key]
    update({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
  }

  const maxPrice = filters.maxPrice || priceCeiling
  const minPrice = Math.max(filters.minPrice, priceFloor)
  const pct = ((maxPrice - priceFloor) / Math.max(1, priceCeiling - priceFloor)) * 100

  const vendorsInPool = activeVendors.filter((v) => products.some((p) => p.vendorId === v.id))
  const categoriesInPool = categories.filter((c) => products.some((p) => p.category === c.name))

  // removable chips for everything that's active
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...filters.categories.map((c) => ({ key: `c-${c}`, label: c, remove: () => toggle('categories', c) })),
    ...filters.vendorIds.map((id) => ({
      key: `v-${id}`,
      label: getVendor(id)?.name ?? id,
      remove: () => toggle('vendorIds', id),
    })),
    ...(filters.onSale ? [{ key: 'sale', label: 'On sale', remove: () => update({ onSale: false }) }] : []),
    ...filters.tags.map((t) => ({ key: `t-${t}`, label: titleCase(t), remove: () => toggle('tags', t) })),
    ...(filters.minRating
      ? [{ key: 'rating', label: `${filters.minRating}★ & up`, remove: () => update({ minRating: 0 }) }]
      : []),
    ...(filters.minPrice > priceFloor
      ? [{ key: 'min', label: `From ${formatPriceWhole(filters.minPrice)}`, remove: () => update({ minPrice: 0 }) }]
      : []),
    ...(maxPrice < priceCeiling
      ? [{ key: 'max', label: `Under ${formatPriceWhole(maxPrice)}`, remove: () => update({ maxPrice: priceCeiling }) }]
      : []),
  ]

  return (
    <div className={cn('bg-surface', !onClose && 'rounded-2xl border border-border shadow-sm', className)}>
      {/* header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-display text-lg font-bold tracking-[-0.01em] text-ink">
            <LuSlidersHorizontal className="h-4 w-4 text-accent" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-sans text-[11px] font-semibold text-on-accent">
                {activeCount}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button type="button" onClick={reset} className="text-caption font-semibold text-accent hover:underline">
                Clear all
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-ink hover:border-accent hover:text-accent"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.remove}
                aria-label={`Remove filter: ${chip.label}`}
                className="flex items-center gap-1 rounded-full bg-ink py-1 pl-2.5 pr-1.5 text-[11px] font-semibold text-bg transition-opacity hover:opacity-80"
              >
                {chip.label}
                <CloseIcon className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="divide-y divide-border">
        {!hideCategories && (
          <Group title="Category">
            {categoriesInPool.map((c) => (
              <CheckRow
                key={c.id}
                label={c.name}
                count={products.filter((p) => p.category === c.name).length}
                checked={filters.categories.includes(c.name)}
                onToggle={() => toggle('categories', c.name)}
              />
            ))}
          </Group>
        )}

        {!hideVendors && (
          <Group title="Maker">
            {vendorsInPool.map((v) => (
              <CheckRow
                key={v.id}
                label={v.name}
                leading={<Avatar src={v.logo} name={v.name} size={22} />}
                count={products.filter((p) => p.vendorId === v.id).length}
                checked={filters.vendorIds.includes(v.id)}
                onToggle={() => toggle('vendorIds', v.id)}
              />
            ))}
          </Group>
        )}

        <Group
          title="Price"
          aside={<span className="text-caption font-semibold text-accent">Under {formatPriceWhole(maxPrice)}</span>}
        >
          <div className="px-1">
            <input
              type="range"
              min={priceFloor}
              max={priceCeiling}
              step={10}
              value={maxPrice}
              aria-label="Maximum price"
              onChange={(e) => update({ maxPrice: Math.max(Number(e.target.value), minPrice) })}
              className="w-full"
              style={{
                background: `linear-gradient(to right, var(--accent) 0 ${pct}%, var(--border-strong) ${pct}% 100%)`,
                backgroundSize: '100% 4px',
                backgroundPosition: '0 center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <PriceBox
              label="Min"
              value={minPrice}
              min={priceFloor}
              max={maxPrice}
              onChange={(v) => update({ minPrice: v <= priceFloor ? 0 : v })}
            />
            <PriceBox
              label="Max"
              value={maxPrice}
              min={minPrice}
              max={priceCeiling}
              onChange={(v) => update({ maxPrice: v })}
            />
          </div>
        </Group>

        <Group title="Rating">
          <div className="flex rounded-full bg-surface-sunken p-1">
            {[0, ...ratings].map((r) => {
              const on = filters.minRating === r
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ minRating: r })}
                  className={cn(
                    'flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-caption font-semibold transition-colors',
                    on ? 'bg-ink text-bg shadow-sm' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {r === 0 ? (
                    'Any'
                  ) : (
                    <>
                      <StarIcon className={cn('h-3 w-3', on ? 'fill-current' : 'fill-accent text-accent')} />
                      {r}+
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </Group>

        <Group title="Details">
          <div className="flex flex-wrap gap-1.5">
            <TagChip label="On sale" on={filters.onSale} onToggle={() => update({ onSale: !filters.onSale })} />
            {commonTags.map((t) => (
              <TagChip key={t} label={titleCase(t)} on={filters.tags.includes(t)} onToggle={() => toggle('tags', t)} />
            ))}
          </div>
        </Group>
      </div>

      {onShowResults && (
        <div className="sticky bottom-0 border-t border-border bg-surface p-4">
          <button
            type="button"
            onClick={onShowResults}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-on-accent shadow-[0_10px_24px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover"
          >
            Show {query.results.length} {query.results.length === 1 ? 'result' : 'results'}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function Group({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-sans! text-[11px] font-semibold! uppercase tracking-[0.14em]! text-accent">{title}</h3>
        {aside}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function CheckRow({
  label,
  count,
  checked,
  onToggle,
  leading,
}: {
  label: string
  count: number
  checked: boolean
  onToggle: () => void
  leading?: ReactNode
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition-colors',
        checked ? 'bg-accent-soft font-semibold text-ink' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
      )}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="peer sr-only" />
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40',
          checked ? 'border-accent! bg-accent text-on-accent' : 'border-border-strong bg-surface',
        )}
      >
        {checked && <CheckIcon className="h-3 w-3" />}
      </span>
      {leading}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
          checked ? 'bg-accent text-on-accent' : 'bg-surface-sunken text-ink-mute',
        )}
      >
        {count}
      </span>
    </label>
  )
}

function PriceBox({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  // edit freely; clamp + apply on blur / Enter so typing "500" doesn't snap at "5"
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const n = Number(draft)
    if (draft.trim() !== '' && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))))
    setDraft(null)
  }

  return (
    <label className="flex flex-col rounded-xl border border-border-strong px-3 py-1.5 transition-colors focus-within:border-accent!">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">{label}</span>
      <span className="flex items-center text-sm font-bold text-ink">
        $
        <input
          type="text"
          inputMode="numeric"
          value={draft ?? String(value)}
          aria-label={`${label}imum price`}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          className="w-full min-w-0 border-0 bg-transparent p-0 text-sm font-bold text-ink tabular-nums outline-none focus:ring-0"
        />
      </span>
    </label>
  )
}

function TagChip({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        'h-8 rounded-full border px-3 text-caption font-semibold transition-colors',
        on ? 'border-ink! bg-ink text-bg' : 'border-border-strong text-ink-soft hover:border-accent! hover:text-accent',
      )}
    >
      {label}
    </button>
  )
}
