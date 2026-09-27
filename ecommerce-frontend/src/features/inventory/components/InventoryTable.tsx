import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuEye, LuHistory, LuPackagePlus, LuSlidersHorizontal } from 'react-icons/lu'
import { DataTable, BulkButton, type Column } from '@/features/admin/components/primitives'
import {
  ColumnsMenu,
  DensityToggle,
  FilterField,
  FilterMenu,
  StockPill,
  TableSearch,
  TableTabs,
  TableToolbar,
  useTablePrefs,
} from '@/features/admin/components/TableKit'
import { Avatar, Button, Drawer, Select } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Product } from '@/shared/types'
import { useInventory } from '../context/InventoryContext'
import { StockHistory } from './StockHistory'
import { StockDialog } from './StockDialog'
import type { StockStatus } from '../lib/status'

type Tab = 'all' | StockStatus

export function InventoryTable({
  products,
  scope,
  detailBase,
}: {
  products: Product[]
  scope: 'admin' | 'vendor'
  detailBase: string
}) {
  const navigate = useNavigate()
  const { categories, patchProduct } = useCatalog()
  const { getVendor } = useVendors()
  const { statusFor, committedUnits, reorderPointFor, bulkReceive } = useInventory()
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [vendorId, setVendorId] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [qty, setQty] = useState('10')
  const [dialog, setDialog] = useState<{ product: Product; mode: 'adjust' | 'receive' } | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [prefs, setPrefs] = useTablePrefs(`inventory-${scope}`)

  const vendorList = useMemo(
    () => [...new Set(products.map((p) => p.vendorId))].map((id) => getVendor(id)).filter(Boolean),
    [products, getVendor],
  )
  const count = (st: StockStatus) => products.filter((p) => statusFor(p) === st).length

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (tab !== 'all' && statusFor(p) !== tab) return false
      if (vendorId && p.vendorId !== vendorId) return false
      if (category && p.category !== category) return false
      if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, search, tab, vendorId, category, statusFor])

  const historyProduct = historyId ? products.find((p) => p.id === historyId) : null
  const filterCount = (vendorId ? 1 : 0) + (category ? 1 : 0)

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      id: 'product',
      sortValue: (p) => p.name,
      cell: (p) => (
        <Link to={`${detailBase}/${p.id}`} className="group flex items-center gap-3">
          <img src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-surface-sunken object-cover" />
          <span className="min-w-0">
            <span className="block max-w-44 truncate font-display font-bold text-ink group-hover:text-accent">{p.name}</span>
            <span className="block text-[11px] uppercase tracking-wide text-ink-mute">{p.sku}</span>
          </span>
        </Link>
      ),
    },
    ...(scope === 'admin'
      ? [
          {
            header: 'Maker',
            id: 'maker',
            hideBelow: 'xl' as const,
            sortValue: (p: Product) => getVendor(p.vendorId)?.name ?? '',
            cell: (p: Product) => {
              const v = getVendor(p.vendorId)
              return (
                <span className="flex items-center gap-2">
                  <Avatar src={v?.logo} name={v?.name ?? '?'} size={22} />
                  <span className="max-w-28 truncate text-ink">{v?.name}</span>
                </span>
              )
            },
          },
        ]
      : []),
    {
      header: 'On hand',
      id: 'onhand',
      align: 'right',
      sortValue: (p) => p.stock,
      cell: (p) => <span className="font-display text-base font-bold text-ink tabular-nums">{p.stock}</span>,
    },
    {
      header: 'Committed',
      id: 'committed',
      align: 'right',
      hideBelow: 'md',
      sortValue: (p) => committedUnits(p.id),
      cell: (p) => <span className="text-ink-mute tabular-nums">{committedUnits(p.id)}</span>,
    },
    {
      header: 'Reorder at',
      id: 'reorder',
      hideBelow: 'md',
      cell: (p) => (
        <input
          type="number"
          min={0}
          value={p.reorderPoint ?? ''}
          placeholder={String(reorderPointFor(p))}
          aria-label={`Reorder point for ${p.name}`}
          onChange={(e) =>
            patchProduct(p.id, { reorderPoint: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })
          }
          className="h-8 w-16 rounded-lg border border-border-strong bg-surface px-2 text-caption tabular-nums outline-none focus:border-accent! focus:ring-4 focus:ring-accent/15"
        />
      ),
    },
    {
      header: 'Status',
      id: 'status',
      sortValue: (p) => ({ out: 0, low: 1, in: 2 })[statusFor(p)],
      cell: (p) => <StockPill status={statusFor(p)} />,
    },
  ]

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(p) => p.id}
        empty="No products match."
        pageSize={10}
        toolbar={
          <TableToolbar
            end={
              <>
                <DensityToggle value={prefs.density} onChange={(density) => setPrefs((p) => ({ ...p, density }))} />
                <ColumnsMenu
                  options={[
                    ...(scope === 'admin' ? [{ id: 'maker', label: 'Maker' }] : []),
                    { id: 'committed', label: 'Committed' },
                    { id: 'reorder', label: 'Reorder at' },
                  ]}
                  hidden={prefs.hidden}
                  onChange={(hidden) => setPrefs((p) => ({ ...p, hidden }))}
                />
                <FilterMenu
                  count={filterCount}
                  onClear={() => {
                    setVendorId('')
                    setCategory('')
                  }}
                >
                  {scope === 'admin' && (
                    <FilterField label="Maker">
                      <Select
                        size="sm"
                        value={vendorId}
                        onChange={setVendorId}
                        options={[{ value: '', label: 'All makers' }, ...vendorList.map((v) => ({ value: v!.id, label: v!.name }))]}
                      />
                    </FilterField>
                  )}
                  <FilterField label="Category">
                    <Select
                      size="sm"
                      value={category}
                      onChange={setCategory}
                      options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
                    />
                  </FilterField>
                </FilterMenu>
              </>
            }
          >
            <TableSearch value={search} onChange={setSearch} placeholder="Search name or SKU" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: products.length },
                { value: 'in', label: 'In stock', count: count('in') },
                { value: 'low', label: 'Low', count: count('low') },
                { value: 'out', label: 'Out', count: count('out') },
              ]}
            />
          </TableToolbar>
        }
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        density={prefs.density}
        hiddenColumns={prefs.hidden}
        defaultSort={{ id: 'onhand', dir: 'asc' }}
        rowActions={[
          { label: 'Receive stock', icon: LuPackagePlus, onClick: (p) => setDialog({ product: p, mode: 'receive' }) },
          { label: 'Adjust', icon: LuSlidersHorizontal, onClick: (p) => setDialog({ product: p, mode: 'adjust' }) },
          { label: 'History', icon: LuHistory, onClick: (p) => setHistoryId(p.id) },
          { label: 'View details', icon: LuEye, onClick: (p) => navigate(`${detailBase}/${p.id}`) },
        ]}
        bulkBar={(keys, clear) => (
          <>
            <span className="flex items-center gap-1.5 px-2 text-caption text-white/70">
              Receive
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                aria-label="Units to receive into each product"
                className="h-8 w-16 rounded-lg border-0 bg-white px-2 text-sm font-semibold text-[#0b0a10] outline-none"
              />
              each
            </span>
            <BulkButton
              icon={LuPackagePlus}
              onClick={() => {
                const n = Number(qty)
                if (!(n > 0)) return
                bulkReceive(keys.map((id) => ({ productId: id, qty: n })))
                notify(`Received ${n} units into ${keys.length} product${keys.length > 1 ? 's' : ''}`, 'success')
                clear()
              }}
            >
              Apply
            </BulkButton>
          </>
        )}
      />

      {dialog && <StockDialog product={dialog.product} mode={dialog.mode} onClose={() => setDialog(null)} />}

      <Drawer
        open={!!historyProduct}
        onClose={() => setHistoryId(null)}
        title={historyProduct ? `${historyProduct.name} — history` : 'History'}
      >
        <div className="p-5">
          {historyProduct && (
            <>
              <div className="mb-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setDialog({ product: historyProduct, mode: 'receive' })
                    setHistoryId(null)
                  }}
                >
                  Receive
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setDialog({ product: historyProduct, mode: 'adjust' })
                    setHistoryId(null)
                  }}
                >
                  Adjust
                </Button>
              </div>
              <StockHistory productId={historyProduct.id} />
            </>
          )}
        </div>
      </Drawer>
    </>
  )
}
