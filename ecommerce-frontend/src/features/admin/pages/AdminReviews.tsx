import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, DataTable, StatCard, Toolbar, type Column } from '../components/primitives'
import { Input, Rating, Select } from '@/shared/ui'
import { formatDate } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Review } from '@/shared/types'

export function AdminReviews() {
  const { reviews, products } = useCatalog()
  const { vendors, getVendor } = useVendors()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [minRating, setMinRating] = useState(0)

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => {
      const product = productMap.get(r.productId)
      if (q && !r.comment.toLowerCase().includes(q) && !r.author.toLowerCase().includes(q) && !(product?.name.toLowerCase().includes(q))) return false
      if (vendorId && product?.vendorId !== vendorId) return false
      if (minRating && r.rating < minRating) return false
      return true
    })
  }, [reviews, productMap, search, vendorId, minRating])

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const columns: Column<Review>[] = [
    {
      header: 'Product',
      cell: (r) => {
        const p = productMap.get(r.productId)
        return p ? (
          <Link to={`/product/${p.id}`} className="flex items-center gap-2 font-medium text-ink hover:text-accent">
            <img src={p.images[0]} alt="" className="h-9 w-9 rounded-sm object-cover" />
            <span className="min-w-0">
              <span className="block truncate">{p.name}</span>
              <span className="block text-caption font-normal text-ink-mute">{getVendor(p.vendorId)?.name}</span>
            </span>
          </Link>
        ) : (
          <span className="text-ink-mute">Deleted product</span>
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
    {
      header: '',
      className: 'text-right',
      cell: () => (
        <button
          type="button"
          onClick={() => notify('Review flagged for follow-up')}
          className="text-caption text-ink-mute hover:text-danger"
        >
          Flag
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Reviews" description={`${reviews.length} across the marketplace`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average rating" value={avg.toFixed(2)} />
        <StatCard label="5-star" value={String(reviews.filter((r) => r.rating === 5).length)} />
        <StatCard label="3-star or below" value={String(reviews.filter((r) => r.rating <= 3).length)} />
      </div>

      <Toolbar>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews…" className="h-9 max-w-xs" />
        <Select
          size="sm"
          value={vendorId}
          onChange={setVendorId}
          options={[{ value: '', label: 'All vendors' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
          className="w-44"
        />
        <Select
          size="sm"
          value={String(minRating)}
          onChange={(v) => setMinRating(Number(v))}
          options={[
            { value: '0', label: 'Any rating' },
            { value: '4', label: '4+ only' },
            { value: '5', label: '5 only' },
          ]}
          className="w-36"
        />
      </Toolbar>

      <DataTable rows={rows} columns={columns} keyOf={(r) => r.id} empty="No reviews match." />
    </div>
  )
}
