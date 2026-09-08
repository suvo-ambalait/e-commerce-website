import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader, DataTable, Toolbar, type Column } from '../components/primitives'
import { Badge, Button, Input, Select } from '@/shared/ui'
import { formatPrice } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { StockStatusBadge } from '@/features/inventory/components/StockStatusBadge'
import type { Product } from '@/shared/types'

export function AdminProducts() {
  const navigate = useNavigate()
  const { products, categories, deleteProduct } = useCatalog()
  const { vendors, getVendor } = useVendors()
  const { statusFor } = useInventory()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [vendorId, setVendorId] = useState('')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (category && p.category !== category) return false
      if (vendorId && p.vendorId !== vendorId) return false
      return true
    })
  }, [products, search, category, vendorId])

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.images[0]} alt="" className="h-10 w-10 rounded-sm object-cover" />
          <div>
            <p className="font-medium text-ink">{p.name}</p>
            <p className="text-caption text-ink-mute">{getVendor(p.vendorId)?.name}</p>
          </div>
        </div>
      ),
    },
    { header: 'Category', cell: (p) => p.category, hideBelow: 'md' },
    { header: 'Price', cell: (p) => formatPrice(p.price) },
    {
      header: 'Stock',
      cell: (p) => (
        <span className="flex items-center gap-2">
          <span className="tabular-nums">{p.stock}</span>
          {statusFor(p) !== 'in' && <StockStatusBadge status={statusFor(p)} />}
        </span>
      ),
      hideBelow: 'sm',
    },
    { header: '', className: 'text-right', cell: (p) => (
      <div className="flex justify-end gap-3">
        <Link to={`/admin/products/${p.id}/edit`} className="text-caption text-accent hover:underline">
          Edit
        </Link>
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
    ) },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description={`${products.length} across all vendors`}
        action={
          <Button size="sm" onClick={() => navigate('/admin/products/new')}>
            Add product
          </Button>
        }
      />
      <Toolbar>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-9 max-w-xs" />
        <Select
          size="sm"
          value={category}
          onChange={setCategory}
          options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
          className="w-44"
        />
        <Select
          size="sm"
          value={vendorId}
          onChange={setVendorId}
          options={[{ value: '', label: 'All vendors' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
          className="w-44"
        />
        {(category || vendorId || search) && (
          <button
            type="button"
            onClick={() => {
              setCategory('')
              setVendorId('')
              setSearch('')
            }}
            className="text-caption text-accent hover:underline"
          >
            Clear
          </button>
        )}
      </Toolbar>
      <DataTable rows={rows} columns={columns} keyOf={(p) => p.id} empty="No products match." />
      {rows.some((p) => p.featured) && (
        <p className="text-caption text-ink-mute">
          <Badge tone="accent">Featured</Badge> products appear on the MorerDokan homepage.
        </p>
      )}
    </div>
  )
}
