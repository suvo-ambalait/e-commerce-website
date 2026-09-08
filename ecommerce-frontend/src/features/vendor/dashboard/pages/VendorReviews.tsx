import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, StatCard, DataTable, type Column } from '@/features/admin/components/primitives'
import { Rating } from '@/shared/ui'
import { formatDate } from '@/shared/lib/format'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import type { Review } from '@/shared/types'

export function VendorReviews() {
  const vendor = useCurrentVendor()
  const { reviews, productsByVendor } = useCatalog()

  const productIds = useMemo(
    () => new Set(vendor ? productsByVendor(vendor.id).map((p) => p.id) : []),
    [vendor, productsByVendor],
  )
  const productMap = useMemo(
    () => new Map((vendor ? productsByVendor(vendor.id) : []).map((p) => [p.id, p])),
    [vendor, productsByVendor],
  )

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const rows = reviews.filter((r) => productIds.has(r.productId))
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0

  const columns: Column<Review>[] = [
    {
      header: 'Product',
      cell: (r) => {
        const p = productMap.get(r.productId)
        return p ? (
          <Link to={`/product/${p.id}`} className="font-medium text-ink hover:text-accent">
            {p.name}
          </Link>
        ) : (
          '—'
        )
      },
    },
    { header: 'Rating', cell: (r) => <Rating value={r.rating} /> },
    {
      header: 'Review',
      cell: (r) => (
        <div className="max-w-md">
          <p className="text-sm text-ink">{r.title}</p>
          <p className="line-clamp-2 text-caption text-ink-mute">{r.comment}</p>
        </div>
      ),
      hideBelow: 'md',
    },
    { header: 'By', cell: (r) => r.author, hideBelow: 'sm' },
    { header: 'Date', cell: (r) => formatDate(r.date), hideBelow: 'lg' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Reviews" description="What customers are saying about your pieces." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average rating" value={avg.toFixed(2)} />
        <StatCard label="Total reviews" value={String(rows.length)} />
        <StatCard label="5-star" value={String(rows.filter((r) => r.rating === 5).length)} />
      </div>
      <DataTable rows={rows} columns={columns} keyOf={(r) => r.id} empty="No reviews yet." />
    </div>
  )
}
