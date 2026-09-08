import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, DataTable, Toolbar, type Column } from '@/features/admin/components/primitives'
import { Badge, Button, ButtonLink, Input } from '@/shared/ui'
import { formatPrice } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { StockStatusBadge } from '@/features/inventory/components/StockStatusBadge'
import type { Product } from '@/shared/types'

export function VendorProducts() {
  const vendor = useCurrentVendor()
  const navigate = useNavigate()
  const { productsByVendor, deleteProduct } = useCatalog()
  const { statusFor } = useInventory()
  const { notify } = useToast()
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    if (!vendor) return []
    const q = search.trim().toLowerCase()
    return productsByVendor(vendor.id).filter((p) => !q || p.name.toLowerCase().includes(q))
  }, [vendor, productsByVendor, search])

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.images[0]} alt="" className="h-10 w-10 rounded-sm object-cover" />
          <span className="font-medium text-ink">{p.name}</span>
        </div>
      ),
    },
    { header: 'Category', cell: (p) => p.category, hideBelow: 'sm' },
    { header: 'Price', cell: (p) => formatPrice(p.price) },
    {
      header: 'Stock',
      cell: (p) => (
        <span className="flex items-center gap-2">
          <span className="tabular-nums">{p.stock}</span>
          {statusFor(p) !== 'in' && <StockStatusBadge status={statusFor(p)} />}
        </span>
      ),
    },
    { header: 'Status', cell: (p) => (p.featured ? <Badge tone="accent">Featured</Badge> : <Badge tone="neutral">Live</Badge>), hideBelow: 'md' },
    {
      header: '',
      cell: (p) => (
        <div className="flex justify-end gap-3">
          <ButtonLink to={`/vendor/dashboard/products/${p.id}/edit`} variant="link" className="text-caption">
            Edit
          </ButtonLink>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete “${p.name}”?`)) {
                deleteProduct(p.id)
                notify('Product deleted')
              }
            }}
            className="text-caption text-ink-mute hover:text-danger"
          >
            Delete
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description={`${rows.length} live in your storefront`}
        action={
          <Button size="sm" onClick={() => navigate('/vendor/dashboard/products/new')}>
            Add product
          </Button>
        }
      />
      <Toolbar>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your products…"
          className="h-9 max-w-xs"
        />
      </Toolbar>
      <DataTable rows={rows} columns={columns} keyOf={(p) => p.id} empty="You haven’t added any products yet." />
    </div>
  )
}
