import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LuArchive,
  LuArchiveRestore,
  LuCheck,
  LuColumns3,
  LuCopy,
  LuDownload,
  LuExternalLink,
  LuFilter,
  LuPencil,
  LuPercent,
  LuPlus,
  LuRows3,
  LuRows4,
  LuTrash2,
  LuTriangleAlert,
  LuX,
} from 'react-icons/lu'
import { PageHeader, DataTable, BulkButton, type Column, type Density } from '../components/primitives'
import { Avatar, Menu, Select } from '@/shared/ui'
import { SearchIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { relativeTime } from '../lib/useNotificationFeed'
import { StockPill, ToolButton } from '../components/TableKit'
import type { Product, ProductStatus } from '@/shared/types'

type Tab = 'all' | 'active' | 'draft' | 'low' | 'archived'
const statusOf = (p: Product): ProductStatus => p.status ?? 'active'

const optionalColumns = ['maker', 'category', 'price', 'stock', 'status', 'updated'] as const
const columnLabels: Record<(typeof optionalColumns)[number], string> = {
  maker: 'Maker',
  category: 'Category',
  price: 'Price',
  stock: 'Stock',
  status: 'Status',
  updated: 'Updated',
}

export function AdminProducts() {
  const navigate = useNavigate()
  const { allProducts, categories, addProduct, patchProduct, deleteProduct } = useCatalog()
  const { vendors, getVendor } = useVendors()
  const { statusFor } = useInventory()
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [category, setCategory] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [bulkPanel, setBulkPanel] = useState<'edit' | 'discount' | null>(null)
  const [prefs, setPrefs] = usePersistedState<{ density: Density; hidden: string[] }>('admin:products:table', {
    density: 'comfortable',
    hidden: [],
  })

  const notArchived = allProducts.filter((p) => statusOf(p) !== 'archived')
  const needRestock = notArchived.filter((p) => statusFor(p) !== 'in')
  const counts: Record<Tab, number> = {
    all: notArchived.length,
    active: allProducts.filter((p) => statusOf(p) === 'active').length,
    draft: allProducts.filter((p) => statusOf(p) === 'draft').length,
    low: needRestock.length,
    archived: allProducts.filter((p) => statusOf(p) === 'archived').length,
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allProducts.filter((p) => {
      const st = statusOf(p)
      if (tab === 'all' && st === 'archived') return false
      if (tab === 'active' && st !== 'active') return false
      if (tab === 'draft' && st !== 'draft') return false
      if (tab === 'archived' && st !== 'archived') return false
      if (tab === 'low' && (st === 'archived' || statusFor(p) === 'in')) return false
      if (category && p.category !== category) return false
      if (vendorId && p.vendorId !== vendorId) return false
      if (q && !`${p.name} ${p.sku} ${getVendor(p.vendorId)?.name ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [allProducts, search, tab, category, vendorId, statusFor, getVendor])

  const studios = new Set(notArchived.map((p) => p.vendorId)).size
  const filterCount = (category ? 1 : 0) + (vendorId ? 1 : 0)

  /* ---------- actions ---------- */
  const duplicate = (p: Product) => {
    const { id: _id, slug: _slug, sku: _sku, ...rest } = p
    const copy = addProduct({ ...rest, name: `${p.name} (copy)`, status: 'draft', createdAt: new Date().toISOString() })
    notify(`Duplicated as a draft — ${copy.name}`, 'success')
  }
  const setStatus = (ids: string[], status: ProductStatus) => {
    ids.forEach((id) => patchProduct(id, { status }))
    const verb = status === 'archived' ? 'Archived' : status === 'draft' ? 'Moved to draft' : 'Set active'
    notify(`${verb}: ${ids.length} product${ids.length > 1 ? 's' : ''}`, 'success')
  }
  const discount = (ids: string[], pct: number) => {
    for (const id of ids) {
      const p = allProducts.find((x) => x.id === id)
      if (!p) continue
      const base = p.originalPrice ?? p.price
      patchProduct(id, pct === 0 ? { price: base, originalPrice: undefined } : { originalPrice: base, price: Math.round(base * (1 - pct) * 100) / 100 })
    }
    notify(pct === 0 ? 'Discount removed' : `${Math.round(pct * 100)}% off applied to ${ids.length} product${ids.length > 1 ? 's' : ''}`, 'success')
  }
  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [
      ['name', 'sku', 'maker', 'category', 'price', 'stock', 'status'].join(','),
      ...rows.map((p) =>
        [p.name, p.sku, getVendor(p.vendorId)?.name ?? '', p.category, p.price, p.stock, statusOf(p)].map(esc).join(','),
      ),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ---------- columns ---------- */
  const columns: Column<Product>[] = [
    {
      header: 'Product',
      id: 'product',
      sortValue: (p) => p.name,
      cell: (p) => (
        <Link to={`/admin/products/${p.id}/edit`} className="group flex items-center gap-3">
          <img src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-surface-sunken object-cover" />
          <span className="min-w-0">
            <span className="block max-w-44 truncate font-display font-bold text-ink group-hover:text-accent">{p.name}</span>
            <span className="block text-[11px] uppercase tracking-wide text-ink-mute">{p.sku}</span>
          </span>
        </Link>
      ),
    },
    {
      header: 'Maker',
      id: 'maker',
      hideBelow: 'xl',
      sortValue: (p) => getVendor(p.vendorId)?.name ?? '',
      cell: (p) => {
        const v = getVendor(p.vendorId)
        return v ? (
          <span className="flex items-center gap-2">
            <Avatar src={v.logo} name={v.name} size={22} />
            <span className="max-w-28 truncate text-ink">{v.name}</span>
          </span>
        ) : (
          '—'
        )
      },
    },
    {
      header: 'Category',
      id: 'category',
      sortValue: (p) => p.category,
      cell: (p) => (
        <span className="whitespace-nowrap rounded-md border border-border bg-surface-sunken/60 px-2 py-0.5 text-caption font-medium text-ink-soft">
          {p.category}
        </span>
      ),
    },
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
    {
      header: 'Stock',
      id: 'stock',
      sortValue: (p) => p.stock,
      cell: (p) => <StockPill status={statusFor(p)} stock={p.stock} />,
    },
    {
      header: 'Status',
      id: 'status',
      hideBelow: 'sm',
      sortValue: (p) => statusOf(p),
      cell: (p) => <StatusPill status={statusOf(p)} />,
    },
    {
      header: 'Updated',
      id: 'updated',
      hideBelow: '2xl',
      sortValue: (p) => p.updatedAt ?? p.createdAt,
      cell: (p) => <span className="whitespace-nowrap text-ink-mute">{relativeTime(p.updatedAt ?? p.createdAt)}</span>,
    },
  ]

  const tabs: { value: Tab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'low', label: 'Low stock' },
    { value: 'archived', label: 'Archived' },
  ]

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-9 w-full items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 focus-within:border-accent! focus-within:ring-4 focus-within:ring-accent/15 sm:w-60">
        <SearchIcon className="h-3.5 w-3.5 shrink-0 text-ink-mute" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products or makers"
          aria-label="Search products"
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-caption text-ink outline-none placeholder:text-ink-mute focus:ring-0"
        />
      </label>

      <div className="flex flex-wrap rounded-xl bg-surface-sunken p-1" role="tablist" aria-label="Product status">
        {tabs.map((t) => {
          const on = tab === t.value
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.value)}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-caption font-semibold transition-colors',
                on ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink',
              )}
            >
              {t.label}
              <span className={cn('text-[11px] tabular-nums', on ? 'text-accent' : 'text-ink-mute')}>{counts[t.value]}</span>
            </button>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-xl border border-border bg-surface p-0.5" role="group" aria-label="Row density">
          {(['comfortable', 'compact'] as Density[]).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={prefs.density === d}
              aria-label={d === 'comfortable' ? 'Comfortable rows' : 'Compact rows'}
              onClick={() => setPrefs((p) => ({ ...p, density: d }))}
              className={cn(
                'flex h-7 w-8 items-center justify-center rounded-lg transition-colors',
                prefs.density === d ? 'bg-accent-soft text-accent' : 'text-ink-mute hover:text-ink',
              )}
            >
              {d === 'comfortable' ? <LuRows3 className="h-4 w-4" /> : <LuRows4 className="h-4 w-4" />}
            </button>
          ))}
        </div>

        <Menu
          trigger={({ toggle, open }) => (
            <ToolButton onClick={toggle} active={open} icon={<LuColumns3 className="h-4 w-4" />}>
              Columns
            </ToolButton>
          )}
        >
          {() => (
            <div className="w-48 py-1">
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Show columns</p>
              {optionalColumns.map((id) => {
                const on = !prefs.hidden.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={() =>
                      setPrefs((p) => ({ ...p, hidden: on ? [...p.hidden, id] : p.hidden.filter((h) => h !== id) }))
                    }
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink-soft hover:bg-accent-soft hover:text-ink"
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-[5px] border',
                        on ? 'border-accent! bg-accent text-on-accent' : 'border-border-strong',
                      )}
                    >
                      {on && <LuCheck className="h-3 w-3" />}
                    </span>
                    {columnLabels[id]}
                  </button>
                )
              })}
            </div>
          )}
        </Menu>

        <Menu
          trigger={({ toggle, open }) => (
            <ToolButton onClick={toggle} active={open || filterCount > 0} icon={<LuFilter className="h-4 w-4" />}>
              Filters
              {filterCount > 0 && (
                <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-on-accent">
                  {filterCount}
                </span>
              )}
            </ToolButton>
          )}
        >
          {() => (
            <div className="w-64 space-y-3 p-2">
              <div>
                <p className="mb-1.5 text-caption font-semibold text-ink">Category</p>
                <Select
                  size="sm"
                  value={category}
                  onChange={setCategory}
                  options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
                />
              </div>
              <div>
                <p className="mb-1.5 text-caption font-semibold text-ink">Maker</p>
                <Select
                  size="sm"
                  value={vendorId}
                  onChange={setVendorId}
                  options={[{ value: '', label: 'All makers' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
                />
              </div>
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory('')
                    setVendorId('')
                  }}
                  className="text-caption font-semibold text-accent hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </Menu>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description={`${counts.all} products from ${studios} shops · ${needRestock.length} need restocking`}
        action={
          <>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50!"
            >
              <LuDownload className="h-4 w-4" />
              Export
            </button>
            <Link
              to="/admin/products/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              <LuPlus className="h-4 w-4" />
              Add product
            </Link>
          </>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(p) => p.id}
        empty={
          <span className="flex flex-col items-center gap-2">
            <LuTriangleAlert className="h-5 w-5 text-ink-mute" />
            No products match these filters.
          </span>
        }
        pageSize={10}
        toolbar={toolbar}
        selectable
        selected={selected}
        onSelectedChange={(keys) => {
          setSelected(keys)
          if (!keys.length) setBulkPanel(null)
        }}
        density={prefs.density}
        hiddenColumns={prefs.hidden}
        defaultSort={{ id: 'updated', dir: 'desc' }}
        rowActions={[
          { label: 'Edit', icon: LuPencil, onClick: (p) => navigate(`/admin/products/${p.id}/edit`) },
          { label: 'Duplicate', icon: LuCopy, onClick: duplicate },
          {
            label: 'View on store',
            icon: LuExternalLink,
            onClick: (p) => window.open(`/product/${p.id}`, '_blank', 'noopener'),
            hidden: (p) => statusOf(p) !== 'active',
          },
          {
            label: 'Restore',
            icon: LuArchiveRestore,
            onClick: (p) => setStatus([p.id], 'draft'),
            hidden: (p) => statusOf(p) !== 'archived',
          },
          {
            label: 'Archive',
            icon: LuArchive,
            danger: true,
            onClick: (p) => setStatus([p.id], 'archived'),
            hidden: (p) => statusOf(p) === 'archived',
          },
          {
            label: 'Delete permanently',
            icon: LuTrash2,
            danger: true,
            onClick: (p) => {
              if (confirm(`Delete “${p.name}” permanently? This can’t be undone.`)) {
                deleteProduct(p.id)
                notify('Product deleted')
              }
            },
            hidden: (p) => statusOf(p) !== 'archived',
          },
        ]}
        bulkBar={(keys, clear) => (
          <div className="relative flex items-center gap-0.5">
            <BulkButton
              icon={LuPencil}
              onClick={() => (keys.length === 1 ? navigate(`/admin/products/${keys[0]}/edit`) : setBulkPanel(bulkPanel === 'edit' ? null : 'edit'))}
            >
              Edit
            </BulkButton>
            <BulkButton icon={LuPercent} onClick={() => setBulkPanel(bulkPanel === 'discount' ? null : 'discount')}>
              Discount
            </BulkButton>
            <BulkButton
              icon={LuArchive}
              danger
              onClick={() => {
                setStatus(keys, 'archived')
                clear()
              }}
            >
              Archive
            </BulkButton>

            {bulkPanel && (
              <div className="absolute bottom-full left-0 mb-3 w-56 rounded-xl border border-white/10 bg-[#0b0a10] p-1.5 shadow-lg">
                <p className="flex items-center justify-between px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a78bfa]">
                  {bulkPanel === 'edit' ? 'Set status' : 'Apply discount'}
                  <button type="button" aria-label="Close" onClick={() => setBulkPanel(null)} className="text-white/60 hover:text-white">
                    <LuX className="h-3.5 w-3.5" />
                  </button>
                </p>
                {bulkPanel === 'edit'
                  ? (['active', 'draft'] as ProductStatus[]).map((st) => (
                      <PanelItem
                        key={st}
                        onClick={() => {
                          setStatus(keys, st)
                          setBulkPanel(null)
                        }}
                      >
                        {st === 'active' ? 'Set active' : 'Move to draft'}
                      </PanelItem>
                    ))
                  : [0.1, 0.15, 0.2, 0.25, 0].map((pct) => (
                      <PanelItem
                        key={pct}
                        onClick={() => {
                          discount(keys, pct)
                          setBulkPanel(null)
                        }}
                      >
                        {pct === 0 ? 'Remove discount' : `${Math.round(pct * 100)}% off`}
                      </PanelItem>
                    ))}
              </div>
            )}
          </div>
        )}
      />
    </div>
  )
}

function PanelItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}

function StatusPill({ status }: { status: ProductStatus }) {
  const map = {
    active: { label: 'Active', dot: 'bg-accent', cls: 'border-border text-ink' },
    draft: { label: 'Draft', dot: 'bg-ink-mute', cls: 'border-border bg-surface-sunken text-ink-soft' },
    archived: { label: 'Archived', dot: 'bg-border-strong', cls: 'border-border bg-surface-sunken text-ink-mute' },
  }[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-0.5 text-caption font-semibold', map.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', map.dot)} />
      {map.label}
    </span>
  )
}
