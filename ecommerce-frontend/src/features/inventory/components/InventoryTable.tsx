import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, Toolbar, type Column } from '@/features/admin/components/primitives'
import { Button, Drawer, Input, Select } from '@/shared/ui'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Product } from '@/shared/types'
import { useInventory } from '../context/InventoryContext'
import { StockStatusBadge } from './StockStatusBadge'
import { StockHistory } from './StockHistory'
import { StockDialog } from './StockDialog'
import { BulkRestockBar } from './BulkRestockBar'
import type { StockStatus } from '../lib/status'

export function InventoryTable({
  products,
  scope,
  detailBase,
}: {
  products: Product[]
  scope: 'admin' | 'vendor'
  detailBase: string
}) {
  const { categories, patchProduct } = useCatalog()
  const { getVendor } = useVendors()
  const { statusFor, committedUnits, reorderPointFor } = useInventory()

  const [search, setSearch] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<StockStatus | ''>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<{ product: Product; mode: 'adjust' | 'receive' } | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)

  const vendorList = useMemo(
    () => [...new Set(products.map((p) => p.vendorId))].map((id) => getVendor(id)).filter(Boolean),
    [products, getVendor],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products
      .filter((p) => {
        if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
        if (vendorId && p.vendorId !== vendorId) return false
        if (category && p.category !== category) return false
        if (status && statusFor(p) !== status) return false
        return true
      })
      .sort((a, b) => a.stock - b.stock)
  }, [products, search, vendorId, category, status, statusFor])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const historyProduct = historyId ? products.find((p) => p.id === historyId) : null

  const columns: Column<Product>[] = [
    {
      header: '',
      cell: (p) => (
        <input
          type="checkbox"
          aria-label={`Select ${p.name}`}
          checked={selected.has(p.id)}
          onChange={() => toggle(p.id)}
          className="h-4 w-4 accent-accent"
        />
      ),
      className: 'w-8',
    },
    {
      header: 'Product',
      cell: (p) => (
        <Link to={`${detailBase}/${p.id}`} className="flex items-center gap-3 font-medium text-ink hover:text-accent">
          <img src={p.images[0]} alt="" className="h-9 w-9 shrink-0 rounded-sm object-cover" />
          <span className="min-w-0">
            <span className="block truncate">{p.name}</span>
            <span className="block text-caption font-normal text-ink-mute">{p.category}</span>
          </span>
        </Link>
      ),
    },
    ...(scope === 'admin'
      ? [{ header: 'Vendor', cell: (p: Product) => getVendor(p.vendorId)?.name, hideBelow: 'lg' as const }]
      : []),
    { header: 'SKU', cell: (p) => <span className="tabular-nums text-caption">{p.sku}</span>, hideBelow: 'lg' },
    { header: 'On hand', cell: (p) => <span className="tabular-nums text-ink">{p.stock}</span> },
    {
      header: 'Committed',
      cell: (p) => <span className="tabular-nums text-ink-mute">{committedUnits(p.id)}</span>,
      hideBelow: 'md',
    },
    {
      header: 'Reorder pt',
      hideBelow: 'md',
      cell: (p) => (
        <input
          type="number"
          min={0}
          value={p.reorderPoint ?? ''}
          placeholder={String(reorderPointFor(p))}
          onChange={(e) =>
            patchProduct(p.id, {
              reorderPoint: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)),
            })
          }
          className="h-8 w-16 rounded-sm border border-border-strong bg-surface px-2 text-caption tabular-nums outline-none focus:border-ink"
        />
      ),
    },
    { header: 'Status', cell: (p) => <StockStatusBadge status={statusFor(p)} /> },
    {
      header: '',
      className: 'text-right',
      cell: (p) => (
        <div className="flex justify-end gap-2.5 text-caption">
          <button type="button" onClick={() => setDialog({ product: p, mode: 'receive' })} className="text-accent hover:underline">
            Receive
          </button>
          <button type="button" onClick={() => setDialog({ product: p, mode: 'adjust' })} className="text-ink-soft hover:text-ink">
            Adjust
          </button>
          <button type="button" onClick={() => setHistoryId(p.id)} className="text-ink-mute hover:text-ink">
            History
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Toolbar>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or SKU…" className="h-9 max-w-xs" />
        {scope === 'admin' && (
          <Select
            size="sm"
            value={vendorId}
            onChange={setVendorId}
            options={[{ value: '', label: 'All vendors' }, ...vendorList.map((v) => ({ value: v!.id, label: v!.name }))]}
            className="w-40"
          />
        )}
        <Select
          size="sm"
          value={category}
          onChange={setCategory}
          options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
          className="w-40"
        />
        <Select
          size="sm"
          value={status}
          onChange={(v) => setStatus(v as StockStatus | '')}
          options={[
            { value: '', label: 'Any status' },
            { value: 'in', label: 'In stock' },
            { value: 'low', label: 'Low' },
            { value: 'out', label: 'Out of stock' },
          ]}
          className="w-36"
        />
        {(search || vendorId || category || status) && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setVendorId('')
              setCategory('')
              setStatus('')
            }}
            className="text-caption text-accent hover:underline"
          >
            Clear
          </button>
        )}
      </Toolbar>

      <BulkRestockBar
        selectedIds={[...selected]}
        onClear={() => setSelected(new Set())}
      />

      <DataTable rows={rows} columns={columns} keyOf={(p) => p.id} empty="No products match." pageSize={12} />

      {dialog && (
        <StockDialog product={dialog.product} mode={dialog.mode} onClose={() => setDialog(null)} />
      )}

      <Drawer
        open={!!historyProduct}
        onClose={() => setHistoryId(null)}
        title={historyProduct ? `${historyProduct.name} — history` : 'History'}
      >
        <div className="p-5">
          {historyProduct && (
            <>
              <div className="mb-4 flex gap-2">
                <Button size="sm" onClick={() => { setDialog({ product: historyProduct, mode: 'receive' }); setHistoryId(null) }}>
                  Receive
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setDialog({ product: historyProduct, mode: 'adjust' }); setHistoryId(null) }}>
                  Adjust
                </Button>
              </div>
              <StockHistory productId={historyProduct.id} />
            </>
          )}
        </div>
      </Drawer>
    </div>
  )
}
