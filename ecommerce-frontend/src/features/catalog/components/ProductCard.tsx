import { type CSSProperties, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { discountFraction, formatPercent } from '@/shared/lib/format'
import { Badge, Price } from '@/shared/ui'
import { HeartIcon, BagIcon, StarIcon } from '@/shared/ui/icons'
import { useCart } from '@/features/cart/context/CartContext'
import { useWishlist } from '@/features/account/context/WishlistContext'
import { useToast } from '@/shared/ui/Toast'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { VendorBadge } from '@/features/vendor/components/VendorBadge'
import type { Product } from '@/shared/types'

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
  const wishlisted = isWishlisted(product.id)
  const off = discountFraction(product.price, product.originalPrice)
  const stockStatus = statusFor(product)
  const soldOut = stockStatus === 'out'

  const quickAdd = (e: MouseEvent) => {
    e.preventDefault()
    addItem(product)
    notify(`${product.name} added to cart`, 'success')
  }

  const wishToggle = (e: MouseEvent) => {
    e.preventDefault()
    toggle(product.id)
  }

  return (
    <article className={cn('group flex flex-col', className)} style={style}>
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[5/6] overflow-hidden rounded-lg bg-surface-sunken ring-1 ring-inset ring-border">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]',
              soldOut && 'opacity-60',
            )}
          />

          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {off > 0 && <Badge tone="sale">−{formatPercent(off)}</Badge>}
            {product.featured && off === 0 && stockStatus === 'in' && <Badge tone="inverse">Featured</Badge>}
            {soldOut && <Badge tone="neutral">Sold out</Badge>}
            {stockStatus === 'low' && <Badge tone="warning">Only {product.stock} left</Badge>}
          </div>

          <button
            type="button"
            onClick={wishToggle}
            aria-label={wishlisted ? 'Remove from saved' : 'Save for later'}
            className={cn(
              'absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-ink-soft shadow-sm backdrop-blur transition-[transform,color,opacity] duration-[var(--dur-1)] hover:scale-105 hover:text-ink',
              'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
              wishlisted && 'text-accent sm:opacity-100',
            )}
          >
            <HeartIcon className={cn('h-4 w-4', wishlisted && 'fill-accent')} />
          </button>

          {!soldOut && (
            <button
              type="button"
              onClick={quickAdd}
              className="absolute inset-x-2.5 bottom-2.5 flex translate-y-2 items-center justify-center gap-1.5 rounded-md bg-ink/95 py-2.5 text-caption font-medium uppercase tracking-wide text-bg opacity-0 shadow-md backdrop-blur transition-[transform,opacity] duration-300 ease-editorial group-hover:translate-y-0 group-hover:opacity-100"
            >
              <BagIcon className="h-3.5 w-3.5" />
              Quick add
            </button>
          )}
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <VendorBadge vendorId={product.vendorId} withLabel={false} className="truncate" />
          {product.reviewCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-caption text-ink-mute tabular-nums">
              <StarIcon className="h-3 w-3 fill-accent text-accent" />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>
        <Link
          to={`/product/${product.id}`}
          className="mt-1 line-clamp-1 text-sm text-ink transition-colors hover:text-accent"
        >
          {product.name}
        </Link>
        <Price
          value={product.price}
          originalPrice={product.originalPrice}
          size="sm"
          className="mt-1.5"
        />
      </div>
    </article>
  )
}
