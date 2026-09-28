import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuCamera, LuMessageSquareQuote, LuSearch, LuStar, LuStore, LuX } from 'react-icons/lu'
import { CustomerPhotoGallery, ReviewPhotoStrip } from '../components/ReviewPhotos'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Avatar, Container, EmptyState, Input, PageHeader, Rating, Section, Select } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatDateLong } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCatalog } from '../context/CatalogContext'

type Sort = 'newest' | 'highest' | 'lowest'
const PAGE = 12

/** Every customer review across the store, filterable by stars, shop and product. */
export function ReviewsPage() {
  useDocumentTitle('Customer reviews · AmbalaEshop')
  const { reviews, allProducts } = useCatalog()
  const { activeVendors, getVendor, getVendorBySlug } = useVendors()
  const [params, setParams] = useSearchParams()
  const [shown, setShown] = useState(PAGE)

  const shopSlug = params.get('shop') ?? ''
  const stars = Number(params.get('rating') ?? 0)
  const query = params.get('q') ?? ''
  const sort = (params.get('sort') as Sort) || 'newest'
  const photosOnly = params.get('photos') === '1'
  const shop = shopSlug ? getVendorBySlug(shopSlug) : undefined

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setShown(PAGE)
  }

  const productById = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts])

  // reviews in scope before the star filter, so the summary reflects the chosen shop/search
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reviews.filter((r) => {
      const product = productById.get(r.productId)
      if (!product) return false
      if (shop && product.vendorId !== shop.id) return false
      if (q && !`${r.title} ${r.comment} ${product.name} ${r.author}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [reviews, productById, shop, query])

  const filtered = useMemo(() => {
    const list = scoped.filter((r) => (!stars || r.rating === stars) && (!photosOnly || Boolean(r.images?.length)))
    return list.sort((a, b) =>
      sort === 'highest' ? b.rating - a.rating || b.date.localeCompare(a.date) : sort === 'lowest' ? a.rating - b.rating || b.date.localeCompare(a.date) : b.date.localeCompare(a.date),
    )
  }, [scoped, stars, sort, photosOnly])

  const withPhotosCount = scoped.filter((r) => r.images?.length).length
  const gallery = useMemo(
    () =>
      scoped.flatMap((r) =>
        (r.images ?? []).map((src) => ({
          src,
          caption: (
            <>
              <span className="font-semibold text-white">{r.author}</span> · {'★'.repeat(r.rating)} · {productById.get(r.productId)?.name}
            </>
          ),
        })),
      ),
    [scoped, productById],
  )

  const average = scoped.length ? scoped.reduce((n, r) => n + r.rating, 0) / scoped.length : 0
  const counts = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: scoped.filter((r) => r.rating === s).length }))
  const positive = scoped.length ? Math.round((scoped.filter((r) => r.rating >= 4).length / scoped.length) * 100) : 0
  const hasFilters = Boolean(shopSlug || stars || query || photosOnly)

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        <PageHeader
          crumbs={[{ label: 'Home', to: '/' }, ...(shop ? [{ label: 'Reviews', to: '/reviews' }, { label: shop.name }] : [{ label: 'Reviews' }])]}
          eyebrow="Customer reviews"
          title={
            shop ? (
              <>
                What customers say about <em>{shop.name}</em>
              </>
            ) : (
              <>
                What our customers <em>say</em>
              </>
            )
          }
          description="Honest reviews from people who bought from our shops. Every review is tied to a real product."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
          {/* summary + filters */}
          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-end gap-3">
                <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.04em] text-ink tabular-nums">
                  {average ? average.toFixed(1) : '—'}
                </span>
                <div className="pb-1">
                  <Rating value={average} size="md" />
                  <p className="mt-1 text-caption text-ink-mute">
                    {scoped.length} {scoped.length === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>
              {scoped.length > 0 && <p className="mt-3 text-sm text-ink-soft">{positive}% gave 4 or 5 stars</p>}

              <div className="mt-4 space-y-1.5">
                {counts.map(({ stars: s, count }) => {
                  const pct = scoped.length ? (count / scoped.length) * 100 : 0
                  const active = stars === s
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={count === 0}
                      aria-pressed={active}
                      onClick={() => setParam('rating', active ? '' : String(s))}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-caption transition-colors disabled:cursor-default disabled:opacity-40',
                        active ? 'bg-accent-soft' : 'hover:bg-surface-sunken',
                      )}
                    >
                      <span className="flex w-8 items-center gap-0.5 font-semibold text-ink">
                        {s}
                        <LuStar className="h-3 w-3 fill-accent text-accent" />
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-7 text-right text-ink-mute tabular-nums">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">Search reviews</span>
                <span className="relative block">
                  <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                  <Input value={query} onChange={(e) => setParam('q', e.target.value)} placeholder="Product, word or name" className="pl-10!" />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">Shop</span>
                <Select
                  value={shopSlug}
                  onChange={(v) => setParam('shop', v)}
                  options={[{ value: '', label: 'All shops' }, ...activeVendors.map((v) => ({ value: v.slug, label: v.name }))]}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <LuCamera className="h-4 w-4 text-accent" />
                  Only reviews with photos
                  <span className="font-normal text-ink-mute">({withPhotosCount})</span>
                </span>
                <input
                  type="checkbox"
                  checked={photosOnly}
                  disabled={withPhotosCount === 0 && !photosOnly}
                  onChange={(e) => setParam('photos', e.target.checked ? '1' : '')}
                  className="h-4 w-4 accent-[#6d28d9]"
                />
              </label>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setParams({}, { replace: true })
                    setShown(PAGE)
                  }}
                  className="inline-flex items-center gap-1.5 text-caption font-semibold text-accent hover:underline"
                >
                  <LuX className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* list */}
          <div className="min-w-0">
            {gallery.length > 0 && !photosOnly && (
              <div className="mb-5 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <CustomerPhotoGallery photos={gallery} limit={10} />
              </div>
            )}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-soft">
                Showing <span className="font-semibold text-ink">{Math.min(shown, filtered.length)}</span> of {filtered.length}
                {stars ? ` · ${stars}-star` : ''}
              </p>
              <div className="w-44">
                <Select
                  value={sort}
                  onChange={(v) => setParam('sort', v === 'newest' ? '' : v)}
                  options={[
                    { value: 'newest', label: 'Newest first' },
                    { value: 'highest', label: 'Highest rated' },
                    { value: 'lowest', label: 'Lowest rated' },
                  ]}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<LuMessageSquareQuote />}
                title={reviews.length === 0 ? 'No reviews yet' : 'No reviews match'}
                description={reviews.length === 0 ? 'Reviews appear here once customers start writing them.' : 'Try another star rating, shop or search word.'}
              />
            ) : (
              <>
                <ul className="grid gap-4 md:grid-cols-2">
                  {filtered.slice(0, shown).map((r) => {
                    const product = productById.get(r.productId)!
                    const vendor = getVendor(product.vendorId)
                    return (
                      <li key={r.id} className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <Rating value={r.rating} />
                          <span className="text-caption text-ink-mute">{formatDateLong(r.date)}</span>
                        </div>
                        <p className="mt-3 font-display text-base font-bold text-ink">{r.title}</p>
                        <p className="mt-1 line-clamp-5 flex-1 text-sm leading-relaxed text-ink-soft">{r.comment}</p>
                        {r.images && r.images.length > 0 && (
                          <div className="mt-3">
                            <ReviewPhotoStrip
                              size="sm"
                              images={r.images}
                              caption={
                                <>
                                  <span className="font-semibold text-white">{r.author}</span> · {product.name}
                                </>
                              }
                            />
                          </div>
                        )}
                        <p className="mt-3 flex items-center gap-2 text-caption text-ink-mute">
                          <Avatar name={r.author} size={22} />
                          {r.author}
                        </p>

                        <Link
                          to={`/product/${product.id}`}
                          className="group mt-4 flex items-center gap-3 rounded-xl bg-surface-sunken/70 p-2.5 transition-colors hover:bg-accent-soft/60"
                        >
                          <img src={product.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink group-hover:text-accent">{product.name}</span>
                            {vendor && (
                              <span className="flex items-center gap-1 text-[11px] text-ink-mute">
                                <LuStore className="h-3 w-3" />
                                {vendor.name}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>

                {shown < filtered.length && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShown((n) => n + PAGE)}
                      className="inline-flex h-11 items-center rounded-full border border-border-strong bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      Show more reviews
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
