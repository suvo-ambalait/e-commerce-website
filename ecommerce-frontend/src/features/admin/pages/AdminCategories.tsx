import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuExternalLink, LuPencil, LuTrash2 } from 'react-icons/lu'
import { PageHeader, DataTable, type Column } from '../components/primitives'
import {
  DensityToggle,
  ExportButton,
  Pill,
  PrimaryLink,
  TableSearch,
  TableToolbar,
  downloadCsv,
  useTablePrefs,
} from '../components/TableKit'
import { formatPrice } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useOrders } from '@/features/orders/context/OrdersContext'
import type { Category } from '@/shared/types'

export function AdminCategories() {
  const navigate = useNavigate()
  const { categories, allProducts, deleteCategory } = useCatalog()
  const { orders } = useOrders()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [prefs, setPrefs] = useTablePrefs('admin-categories')

  const live = (name: string) => allProducts.filter((p) => p.category === name && (p.status ?? 'active') === 'active').length
  const sales = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of orders.flatMap((o) => o.shipments).flatMap((s) => s.items)) m.set(i.category, (m.get(i.category) ?? 0) + i.price * i.quantity)
    return m
  }, [orders])

  const rows = categories.filter((c) => {
    const q = search.trim().toLowerCase()
    return !q || `${c.name} ${c.description}`.toLowerCase().includes(q)
  })

  const columns: Column<Category>[] = [
    {
      header: 'Category',
      id: 'name',
      sortValue: (c) => c.name,
      cell: (c) => (
        <Link to={`/admin/categories/${c.id}/edit`} className="group flex items-center gap-3">
          <img src={c.image} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-surface-sunken object-cover" />
          <span className="min-w-0">
            <span className="block font-display font-bold text-ink group-hover:text-accent">{c.name}</span>
            <span className="block text-[11px] text-ink-mute">/{c.slug}</span>
          </span>
        </Link>
      ),
    },
    {
      header: 'Description',
      id: 'description',
      hideBelow: 'lg',
      cell: (c) => <span className="line-clamp-2 max-w-md text-ink-soft">{c.description}</span>,
    },
    {
      header: 'Live pieces',
      id: 'pieces',
      align: 'right',
      sortValue: (c) => live(c.name),
      cell: (c) =>
        live(c.name) ? (
          <span className="font-bold text-ink tabular-nums">{live(c.name)}</span>
        ) : (
          <Pill tone="muted">Empty</Pill>
        ),
    },
    {
      header: 'Sales',
      id: 'sales',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (c) => sales.get(c.name) ?? 0,
      cell: (c) => <span className="text-ink-soft tabular-nums">{formatPrice(sales.get(c.name) ?? 0)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categories"
        description={`${categories.length} departments in the shop`}
        action={
          <>
            <ExportButton
              onClick={() =>
                downloadCsv('categories.csv', ['name', 'slug', 'live_pieces', 'sales'], rows.map((c) => [c.name, c.slug, live(c.name), (sales.get(c.name) ?? 0).toFixed(2)]))
              }
            />
            <PrimaryLink to="/admin/categories/new">Add category</PrimaryLink>
          </>
        }
      />
      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(c) => c.id}
        empty="No categories match."
        toolbar={
          <TableToolbar end={<DensityToggle value={prefs.density} onChange={(density) => setPrefs((p) => ({ ...p, density }))} />}>
            <TableSearch value={search} onChange={setSearch} placeholder="Search categories" />
          </TableToolbar>
        }
        density={prefs.density}
        defaultSort={{ id: 'pieces', dir: 'desc' }}
        rowActions={[
          { label: 'Edit', icon: LuPencil, onClick: (c) => navigate(`/admin/categories/${c.id}/edit`) },
          {
            label: 'View in shop',
            icon: LuExternalLink,
            onClick: (c) => window.open(`/shop?category=${encodeURIComponent(c.name)}`, '_blank', 'noopener'),
          },
          {
            label: 'Delete',
            icon: LuTrash2,
            danger: true,
            onClick: (c) => {
              const n = allProducts.filter((p) => p.category === c.name).length
              if (confirm(n ? `Delete “${c.name}”? ${n} products still use it.` : `Delete “${c.name}”?`)) {
                deleteCategory(c.id)
                notify('Category deleted')
              }
            },
          },
        ]}
      />
    </div>
  )
}
