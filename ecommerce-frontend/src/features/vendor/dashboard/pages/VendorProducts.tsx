import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuArchive, LuArchiveRestore, LuExternalLink, LuPencil, LuStar } from 'react-icons/lu'
import { PageHeader, DataTable, BulkButton, type Column } from '@/features/admin/components/primitives'
import {
  DensityToggle,
  Pill,
  PrimaryLink,
  StockPill,
  Tag,
  TableSearch,
  TableTabs,
  TableToolbar,
  useTablePrefs,
} from '@/features/admin/components/TableKit'
import { formatPrice } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import type { Product, ProductStatus } from '@/shared/types'

type Tab = 'all' | 'active' | 'draft' | 'low' | 'archived'
const statusOf = (p: Product): ProductStatus => p.status ?? 'active'

export function VendorProducts() {
  const vendor = useCurrentVendor()
  const navigate = useNavigate()
  const { allProducts, patchProduct } = useCatalog()
  const { statusFor } = useInventory()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [prefs, setPrefs] = useTablePrefs('vendor-products')

  // every listing this studio owns — drafts and archived included
  const mine = useMemo(() => (vendor ? allProducts.filter((p) => p.vendorId === vendor.id) : []), [vendor, allProducts])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mine.filter((p) => {
      const st = statusOf(p)
      if (tab === 'all' && st === 'archived') return false
      if ((tab === 'active' || tab === 'draft' || tab === 'archived') && st !== tab) return false
      if (tab === 'low' && (st === 'archived' || statusFor(p) === 'in')) return false
      return !q || `${p.name} ${p.sku}`.toLowerCase().includes(q)
    })
  }, [mine, search, tab, statusFor])

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const n = (f: (p: Product) => boolean) => mine.filter(f).length
  const setStatus = (ids: string[], status: ProductStatus) => {
    ids.forEach((id) => patchProduct(id, { status }))
    notify(`${status === 'archived' ? 'Archived' : status === 'draft' ? 'Moved to draft' : 'Published'}: ${ids.length}`, 'success')
  }

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      id: 'product',
      sortValue: (p) => p.name,
      cell: (p) => (
        <Link to={`/vendor/dashboard/products/${p.id}/edit`} className="group flex items-center gap-3">
          <img src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-surface-sunken object-cover" />
          <span className="min-w-0">
            <span className="flex max-w-52 items-center gap-1.5 truncate font-display font-bold text-ink group-hover:text-accent">
              {p.name}
              {p.featured && <LuStar className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" aria-label="Featured" />}
            </span>
            <span className="block text-[11px] uppercase tracking-wide text-ink-mute">{p.sku}</span>
          </span>
        </Link>
      ),
    },
    { header: 'Category', id: 'category', hideBelow: 'md', sortValue: (p) => p.category, cell: (p) => <Tag>{p.category}</Tag> },
    {
      header: 'Price',
      id: 'price',
      align: 'right',
      sortValue: (p) => p.price,
      cell: (p) => (
        <span className="flex flex-col items-end">
          <span className="font-bold text-ink tabular-nums">{formatPrice(p.price)}</span>
          {p.originalPrice != null && p.originalPrice > p.price && (
            <span className="text-[11px] text-ink-mute line-through tabular-nums">{formatPrice(p.originalPrice)}</span>
          )}
        </span>
      ),
    },
    { header: 'Stock', id: 'stock', sortValue: (p) => p.stock, cell: (p) => <StockPill status={statusFor(p)} stock={p.stock} /> },
    {
      header: 'Status',
      id: 'status',
      hideBelow: 'sm',
      sortValue: (p) => statusOf(p),
      cell: (p) =>
        statusOf(p) === 'active' ? (
          <Pill tone="outline" dot>
            Live
          </Pill>
        ) : statusOf(p) === 'draft' ? (
          <Pill tone="neutral" dot>
            Draft
          </Pill>
        ) : (
          <Pill tone="muted" dot>
            Archived
          </Pill>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description={`${n((p) => statusOf(p) === 'active')} live in your storefront · ${n((p) => statusOf(p) !== 'archived' && statusFor(p) !== 'in')} need restocking`}
        action={<PrimaryLink to="/vendor/dashboard/products/new">Add product</PrimaryLink>}
      />
      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(p) => p.id}
        empty="No products here yet."
        toolbar={
          <TableToolbar end={<DensityToggle value={prefs.density} onChange={(density) => setPrefs((p) => ({ ...p, density }))} />}>
            <TableSearch value={search} onChange={setSearch} placeholder="Search your products" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: n((p) => statusOf(p) !== 'archived') },
                { value: 'active', label: 'Live', count: n((p) => statusOf(p) === 'active') },
                { value: 'draft', label: 'Draft', count: n((p) => statusOf(p) === 'draft') },
                { value: 'low', label: 'Low stock', count: n((p) => statusOf(p) !== 'archived' && statusFor(p) !== 'in') },
                { value: 'archived', label: 'Archived', count: n((p) => statusOf(p) === 'archived') },
              ]}
            />
          </TableToolbar>
        }
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        density={prefs.density}
        defaultSort={{ id: 'product', dir: 'asc' }}
        rowActions={[
          { label: 'Edit', icon: LuPencil, onClick: (p) => navigate(`/vendor/dashboard/products/${p.id}/edit`) },
          {
            label: 'View on store',
            icon: LuExternalLink,
            onClick: (p) => window.open(`/product/${p.id}`, '_blank', 'noopener'),
            hidden: (p) => statusOf(p) !== 'active',
          },
          { label: 'Restore', icon: LuArchiveRestore, onClick: (p) => setStatus([p.id], 'draft'), hidden: (p) => statusOf(p) !== 'archived' },
          { label: 'Archive', icon: LuArchive, danger: true, onClick: (p) => setStatus([p.id], 'archived'), hidden: (p) => statusOf(p) === 'archived' },
        ]}
        bulkBar={(keys, clear) => (
          <>
            <BulkButton onClick={() => { setStatus(keys, 'active'); clear() }}>Publish</BulkButton>
            <BulkButton onClick={() => { setStatus(keys, 'draft'); clear() }}>Move to draft</BulkButton>
            <BulkButton icon={LuArchive} danger onClick={() => { setStatus(keys, 'archived'); clear() }}>
              Archive
            </BulkButton>
          </>
        )}
      />
    </div>
  )
}
