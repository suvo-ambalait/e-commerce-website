import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LuExternalLink, LuMessageSquareQuote, LuStar, LuThumbsDown } from 'react-icons/lu'
import { PageHeader, StatCard, StatGrid, FadeItem, DataTable, type Column } from '@/features/admin/components/primitives'
import { TableSearch, TableTabs, TableToolbar } from '@/features/admin/components/TableKit'
import { Rating } from '@/shared/ui'
import { formatDate } from '@/shared/lib/format'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import type { Review } from '@/shared/types'
import { ReviewPhotoStrip } from '@/features/catalog/components/ReviewPhotos'

type Tab = 'all' | '5' | '4' | 'low'

export function VendorReviews() {
  const vendor = useCurrentVendor()
  const { reviews, allProducts } = useCatalog()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')

  const productMap = useMemo(
    () => new Map(allProducts.filter((p) => p.vendorId === vendor?.id).map((p) => [p.id, p])),
    [allProducts, vendor],
  )
  const mine = useMemo(() => reviews.filter((r) => productMap.has(r.productId)), [reviews, productMap])

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const q = search.trim().toLowerCase()
  const rows = mine.filter((r) => {
    if (tab === '5' && r.rating !== 5) return false
    if (tab === '4' && r.rating !== 4) return false
    if (tab === 'low' && r.rating > 3) return false
    return !q || `${r.title} ${r.comment} ${r.author} ${productMap.get(r.productId)?.name ?? ''}`.toLowerCase().includes(q)
  })
  const avg = mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : 0
  const n = (f: (r: Review) => boolean) => mine.filter(f).length

  const columns: Column<Review>[] = [
    {
      header: 'Product',
      id: 'product',
      sortValue: (r) => productMap.get(r.productId)?.name ?? '',
      cell: (r) => {
        const p = productMap.get(r.productId)
        return p ? (
          <Link to={`/vendor/dashboard/products/${p.id}/edit`} className="group flex items-center gap-3">
            <img src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-surface-sunken object-cover" />
            <span className="block max-w-44 truncate font-display font-bold text-ink group-hover:text-accent">{p.name}</span>
          </Link>
        ) : (
          '—'
        )
      },
    },
    { header: 'Rating', id: 'rating', sortValue: (r) => r.rating, cell: (r) => <Rating value={r.rating} /> },
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
    { header: 'By', id: 'author', hideBelow: 'lg', sortValue: (r) => r.author, cell: (r) => <span className="text-ink-soft">{r.author}</span> },
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
      <PageHeader title="Reviews" description="What customers are saying about your pieces." />
      <StatGrid>
        <FadeItem>
          <StatCard label="Average rating" value={avg.toFixed(2)} icon={LuStar} hint={`from ${mine.length} reviews`} />
        </FadeItem>
        <FadeItem>
          <StatCard label="5-star" value={String(n((r) => r.rating === 5))} icon={LuMessageSquareQuote} />
        </FadeItem>
        <FadeItem>
          <StatCard label="4-star" value={String(n((r) => r.rating === 4))} icon={LuStar} />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="3-star or below"
            value={String(n((r) => r.rating <= 3))}
            icon={LuThumbsDown}
            tone={n((r) => r.rating <= 3) ? 'warning' : 'default'}
          />
        </FadeItem>
      </StatGrid>
      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(r) => r.id}
        empty="No reviews match."
        toolbar={
          <TableToolbar>
            <TableSearch value={search} onChange={setSearch} placeholder="Search reviews" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: mine.length },
                { value: '5', label: '5★', count: n((r) => r.rating === 5) },
                { value: '4', label: '4★', count: n((r) => r.rating === 4) },
                { value: 'low', label: '3★ & below', count: n((r) => r.rating <= 3) },
              ]}
            />
          </TableToolbar>
        }
        defaultSort={{ id: 'date', dir: 'desc' }}
        rowActions={[
          { label: 'View on store', icon: LuExternalLink, onClick: (r) => window.open(`/product/${r.productId}`, '_blank', 'noopener') },
        ]}
      />
    </div>
  )
}
