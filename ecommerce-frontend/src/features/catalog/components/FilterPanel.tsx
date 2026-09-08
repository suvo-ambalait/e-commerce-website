import { Checkbox, Radio } from '@/shared/ui'
import { formatPrice } from '@/shared/lib/format'
import { useCatalog } from '../context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { ProductFilters } from '../lib/useProductQuery'

const ratings = [4.5, 4, 3.5]
const commonTags = ['bestseller', 'new', 'brass', 'wool', 'linen', 'gift', 'set']

export function FilterPanel({
  filters,
  update,
  priceCeiling,
  hideVendors = false,
  hideCategories = false,
}: {
  filters: ProductFilters
  update: (patch: Partial<ProductFilters>) => void
  priceCeiling: number
  hideVendors?: boolean
  hideCategories?: boolean
}) {
  const { categories } = useCatalog()
  const { activeVendors } = useVendors()

  const toggle = (key: 'categories' | 'vendorIds' | 'tags', value: string) => {
    const list = filters[key]
    update({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
  }

  return (
    <div className="space-y-7">
      {!hideCategories && (
        <Group title="Category">
          {categories.map((c) => (
            <Checkbox
              key={c.id}
              label={c.name}
              checked={filters.categories.includes(c.name)}
              onChange={() => toggle('categories', c.name)}
            />
          ))}
        </Group>
      )}

      {!hideVendors && (
        <Group title="Maker">
          {activeVendors.map((v) => (
            <Checkbox
              key={v.id}
              label={v.name}
              checked={filters.vendorIds.includes(v.id)}
              onChange={() => toggle('vendorIds', v.id)}
            />
          ))}
        </Group>
      )}

      <Group title={`Under ${formatPrice(filters.maxPrice || priceCeiling)}`}>
        {(() => {
          const value = filters.maxPrice || priceCeiling
          const pct = ((value - 20) / (priceCeiling - 20)) * 100
          return (
            <input
              type="range"
              min={20}
              max={priceCeiling}
              step={10}
              value={value}
              onChange={(e) => update({ maxPrice: Number(e.target.value) })}
              className="w-full"
              style={{
                background: `linear-gradient(to right, var(--accent) 0 ${pct}%, var(--border-strong) ${pct}% 100%)`,
                backgroundSize: '100% 2px',
                backgroundPosition: '0 center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          )
        })()}
        <div className="flex justify-between text-caption text-ink-mute">
          <span>{formatPrice(20)}</span>
          <span>{formatPrice(priceCeiling)}</span>
        </div>
      </Group>

      <Group title="Rating">
        <Radio
          label="Any rating"
          name="rating"
          checked={filters.minRating === 0}
          onChange={() => update({ minRating: 0 })}
        />
        {ratings.map((r) => (
          <Radio
            key={r}
            name="rating"
            label={`${r} & up`}
            checked={filters.minRating === r}
            onChange={() => update({ minRating: r })}
          />
        ))}
      </Group>

      <Group title="Details">
        <Checkbox
          label="On sale"
          checked={filters.onSale}
          onChange={() => update({ onSale: !filters.onSale })}
        />
        {commonTags.map((t) => (
          <Checkbox
            key={t}
            label={t[0].toUpperCase() + t.slice(1)}
            checked={filters.tags.includes(t)}
            onChange={() => toggle('tags', t)}
          />
        ))}
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-caption font-medium uppercase tracking-wide text-ink-mute">{title}</h3>
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  )
}
