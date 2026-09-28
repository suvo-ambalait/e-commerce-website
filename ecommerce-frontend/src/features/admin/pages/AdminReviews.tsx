import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LuExternalLink, LuFlag, LuMessageSquareQuote, LuStar, LuThumbsDown } from 'react-icons/lu'
import { PageHeader, DataTable, StatCard, StatGrid, FadeItem, type Column } from '../components/primitives'
import { ReviewPhotoStrip } from '@/features/catalog/components/ReviewPhotos'
import {
  ColumnsMenu,
  DensityToggle,
  ExportButton,
  FilterField,
  FilterMenu,
  TableSearch,
  TableTabs,
  TableToolbar,
  downloadCsv,
  useTablePrefs,
} from '../components/TableKit'
import { Rating, Select } from '@/shared/ui'
import { formatDate } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Review } from '@/shared/types'

type Tab = 'all' | '5' | '4' | 'low'

export function AdminReviews() {
  const { reviews, allProducts } = useCatalog()
  const { vendors, getVendor } = useVendors()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [vendorId, setVendorId] = useState('')
  const [prefs, setPrefs] = useTablePrefs('admin-reviews')

  const productMap = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => {
      const product = productMap.get(r.productId)
      if (tab === '5' && r.rating !== 5) return false
      if (tab === '4' && r.rating !== 4) return false
      if (tab === 'low' && r.rating > 3) return false
      if (vendorId && product?.vendorId !== vendorId) return false
      if (q && !`${r.title} ${r.comment} ${r.author} ${product?.name ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [reviews, productMap, search, tab, vendorId])

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const n = (f: (r: Review) => boolean) => reviews.filter(f).length

  const columns: Column<Review>[] = [
    {
      header: 'Product',
      id: 'product',
      sortValue: (r) => productMap.get(r.productId)?.name ?? '',
      cell: (r) => {
        const p = productMap.get(r.productId)
        return p ? (
          <Link to={`/admin/products/${p.id}/edit`} className="group flex items-center gap-3">
            <img src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-surface-sunken object-cover" />
            <span className="min-w-0">
              <span className="block max-w-44 truncate font-display font-bold text-ink group-hover:text-accent">{p.name}</span>
              <span className="block max-w-44 truncate text-[11px] text-ink-mute">{getVendor(p.vendorId)?.name}</span>
            </span>
          </Link>
        ) : (
          <span className="text-ink-mute">Deleted product</span>
        )
      },
    },
    {
      header: 'Rating',
      id: 'rating',
      sortValue: (r) => r.rating,
      cell: (r) => <Rating value={r.rating} />,
    },
    {
      header: 'Review',
      id: 'review',
      hideBelow: 'md',
      cell: (r) => (
        <div className="max-w-sm">
          <p className="truncate font-semibold text-ink">{r.title}</p>
          <p className="line-clamp-2 text-caption text-ink-mute">{r.comment}</p>
          {r.images && r.images.length > 0 && (
            <div className="mt-2">
              <ReviewPhotoStrip size="sm" images={r.images} caption={<>{r.author} · {r.title}</>} />
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'By',
      id: 'author',
      hideBelow: 'lg',
      sortValue: (r) => r.author,
      cell: (r) => <span className="whitespace-nowrap text-ink-soft">{r.author}</span>,
    },
    {
      header: 'Date',
      id: 'date',
      hideBelow: 'sm',
      sortValue: (r) => r.date,
      cell: (r) => <span className="whitespace-nowrap text-ink-mute">{formatDate(r.date)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reviews"
        description={`${reviews.length} reviews across the marketplace`}
        action={
          <ExportButton
            onClick={() =>
              downloadCsv(
                'reviews.csv',
                ['product', 'rating', 'title', 'comment', 'author', 'date'],
                rows.map((r) => [productMap.get(r.productId)?.name ?? '', r.rating, r.title, r.comment, r.author, r.date.slice(0, 10)]),
              )
            }
          />
        }
      />

      <StatGrid>
        <FadeItem>
          <StatCard label="Average rating" value={avg.toFixed(2)} icon={LuStar} hint={`from ${reviews.length} reviews`} />
        </FadeItem>
        <FadeItem>
          <StatCard label="5-star" value={String(n((r) => r.rating === 5))} icon={LuMessageSquareQuote} hint="glowing" />
        </FadeItem>
        <FadeItem>
          <StatCard label="4-star" value={String(n((r) => r.rating === 4))} icon={LuStar} hint="happy" />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="3-star or below"
            value={String(n((r) => r.rating <= 3))}
            icon={LuThumbsDown}
            tone={n((r) => r.rating <= 3) ? 'warning' : 'default'}
            hint="worth a follow-up"
          />
        </FadeItem>
      </StatGrid>

      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(r) => r.id}
        empty="No reviews match."
        toolbar={
          <TableToolbar
            end={
              <>
                <DensityToggle value={prefs.density} onChange={(density) => setPrefs((p) => ({ ...p, density }))} />
                <ColumnsMenu
                  options={[
                    { id: 'review', label: 'Review' },
                    { id: 'author', label: 'By' },
                    { id: 'date', label: 'Date' },
                  ]}
                  hidden={prefs.hidden}
                  onChange={(hidden) => setPrefs((p) => ({ ...p, hidden }))}
                />
                <FilterMenu count={vendorId ? 1 : 0} onClear={() => setVendorId('')}>
                  <FilterField label="Maker">
                    <Select
                      size="sm"
                      value={vendorId}
                      onChange={setVendorId}
                      options={[{ value: '', label: 'All makers' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
                    />
                  </FilterField>
                </FilterMenu>
              </>
            }
          >
            <TableSearch value={search} onChange={setSearch} placeholder="Search reviews" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: reviews.length },
                { value: '5', label: '5★', count: n((r) => r.rating === 5) },
                { value: '4', label: '4★', count: n((r) => r.rating === 4) },
                { value: 'low', label: '3★ & below', count: n((r) => r.rating <= 3) },
              ]}
            />
          </TableToolbar>
        }
        density={prefs.density}
        hiddenColumns={prefs.hidden}
        defaultSort={{ id: 'date', dir: 'desc' }}
        rowActions={[
          {
            label: 'View on store',
            icon: LuExternalLink,
            onClick: (r) => window.open(`/product/${r.productId}`, '_blank', 'noopener'),
            hidden: (r) => !productMap.has(r.productId),
          },
          { label: 'Flag for follow-up', icon: LuFlag, onClick: () => notify('Review flagged for follow-up') },
        ]}
      />
    </div>
  )
}
