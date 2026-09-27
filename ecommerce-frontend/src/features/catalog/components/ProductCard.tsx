import { useState, type CSSProperties, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { discountFraction, formatPercent, formatPrice } from '@/shared/lib/format'
import { HeartIcon, BagIcon, StarIcon } from '@/shared/ui/icons'
import { useCart } from '@/features/cart/context/CartContext'
import { useWishlist } from '@/features/account/context/WishlistContext'
import { useToast } from '@/shared/ui/Toast'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import type { Product } from '@/shared/types'

/** a product counts as "New in" when added within this many days of the newest one */
const NEW_WINDOW_DAYS = 45

export function ProductCard({
  product,
  className,
  style,
}: {
  product: Product
  className?: string
  style?: CSSProperties
}) {
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const { notify } = useToast()
  const { statusFor } = useInventory()
  const { products } = useCatalog()
  const [shot, setShot] = useState(0)

  const wishlisted = isWishlisted(product.id)
  const off = discountFraction(product.price, product.originalPrice)
  const stockStatus = statusFor(product)
  const soldOut = stockStatus === 'out'
  const images = product.images.slice(0, 4)

  const newest = Math.max(...products.map((p) => Date.parse(p.createdAt) || 0))
  const isNew = newest - (Date.parse(product.createdAt) || 0) <= NEW_WINDOW_DAYS * 86_400_000

  const addToCart = () => {
    addItem(product)
    notify(`${product.name} added to cart`, 'success')
  }

  const wishToggle = (e: MouseEvent) => {
    e.preventDefault()
    toggle(product.id)
  }

  const pickShot = (e: MouseEvent, i: number) => {
    e.preventDefault()
    setShot(i)
  }

  return (
    <article
      className={cn(
        'group @container flex flex-col rounded-[20px] border border-border bg-surface p-2.5 transition-[box-shadow,transform] duration-300 ease-editorial hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(40,20,80,0.12)]',
        className,
      )}
      style={style}
    >
      {/* media */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/3.6] overflow-hidden rounded-2xl bg-accent-soft">
          {/* decorative rings, visible while the photo loads */}
          <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15" />
          <div className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15" />

          <img
            src={images[shot] ?? images[0]}
            alt={product.name}
            loading="lazy"
            className={cn(
              'relative h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]',
              soldOut && 'opacity-60',
            )}
          />

          <div className="absolute left-2.5 right-12 top-2.5 flex flex-wrap items-center gap-1.5">
            {isNew && !soldOut && (
              <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                New in
              </span>
            )}
            {off > 0 && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-bg">
                −{formatPercent(off)}
              </span>
            )}
            {soldOut && (
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink-soft shadow-sm">
                Sold out
              </span>
            )}
            {stockStatus === 'low' && (
              <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning">
                Only {product.stock} left
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={wishToggle}
            aria-label={wishlisted ? 'Remove from saved' : 'Save for later'}
            aria-pressed={wishlisted}
            className={cn(
              'absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-soft shadow-sm transition-[transform,color] duration-(--dur-1) hover:scale-105 hover:text-ink',
              wishlisted && 'text-accent hover:text-accent',
            )}
          >
            <HeartIcon className={cn('h-4 w-4', wishlisted && 'fill-accent')} />
          </button>

          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => pickShot(e, i)}
                  aria-label={`Show image ${i + 1} of ${images.length}`}
                  aria-current={i === shot}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === shot ? 'w-4 bg-ink' : 'w-1.5 bg-ink/30 hover:bg-ink/50',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* details */}
      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
            {product.category}
          </span>
          {product.reviewCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-ink-mute tabular-nums">
              <StarIcon className="h-3 w-3 fill-accent text-accent" />
              <span className="font-semibold text-ink">{product.rating.toFixed(1)}</span>
              <span className="hidden @[14rem]:inline">({product.reviewCount} reviews)</span>
            </span>
          )}
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-1.5 line-clamp-1 font-display text-base font-bold tracking-[-0.01em] text-ink hover:text-accent sm:text-lg"
        >
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-1 text-caption text-ink-mute">
          {product.materials || product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-lg font-bold leading-tight text-ink tabular-nums">
              {formatPrice(product.price)}
            </span>
            {off > 0 && product.originalPrice != null && (
              <span className="text-caption text-ink-mute line-through tabular-nums">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={soldOut}
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold @[15.5rem]:px-4 text-on-accent shadow-[0_8px_20px_rgba(109,40,217,0.28)] transition-colors hover:bg-accent-hover disabled:bg-surface-sunken disabled:text-ink-mute disabled:shadow-none"
          >
            <BagIcon className="h-4 w-4" />
            <span className="hidden @[15.5rem]:inline">{soldOut ? 'Sold out' : 'Add to cart'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
