import { Link } from 'react-router-dom'
import { LuTrash2, LuLock } from 'react-icons/lu'
import { useCart } from '../context/CartContext'
import { useCartPricing } from '../lib/useCartPricing'
import { PillStepper } from './PillStepper'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { Drawer } from '@/shared/ui'
import { BagIcon, CloseIcon, StoreIcon, TruckIcon } from '@/shared/ui/icons'
import { formatPrice, formatPriceWhole } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { groups, items, totalItems, subtotal, updateQuantity, removeItem } = useCart()
  const { totals, freeShippingThreshold } = useCartPricing()
  const { getVendor } = useVendors()

  // shipping is charged per studio; each studio's order ships free over the threshold
  const shipments = totals.shipments
  const freeCount = shipments.filter((s) => s.shipping === 0).length
  const allFree = shipments.length > 0 && freeCount === shipments.length
  const single = shipments.length === 1 ? shipments[0] : undefined
  const progress = allFree ? 1 : single ? Math.min(1, single.subtotal / freeShippingThreshold) : freeCount / shipments.length
  const shippingMessage = allFree
    ? 'You get free delivery!'
    : single
      ? `Add ${formatPrice(freeShippingThreshold - single.subtotal)} more to get free delivery.`
      : `Free delivery from ${freeCount} of ${shipments.length} shops. Each shop delivers free over ${formatPriceWhole(freeShippingThreshold)}.`
  const payable = subtotal + totals.shipping

  const header = (
    <div className="flex items-center justify-between px-5 pb-3 pt-5">
      <div className="flex items-center gap-2.5">
        <h2 className="font-display! text-2xl font-extrabold! tracking-[-0.03em]! text-ink">Your cart</h2>
        {totalItems > 0 && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-caption font-semibold text-accent tabular-nums">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong text-ink transition-colors hover:border-accent hover:text-accent"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <Drawer open={open} onClose={onClose} header={header}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <BagIcon className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-bold text-ink">Your cart is empty</p>
          <p className="-mt-2 text-sm text-ink-soft">Products you add will show here.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 h-11 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            Continue shopping
          </button>
        </div>
      ) : (
        <div className="flex min-h-full flex-col">
          {/* free-shipping progress */}
          <div className="mx-5 rounded-2xl bg-accent-soft/70 p-3.5">
            <p className="flex items-center gap-2 text-caption font-semibold text-ink">
              <TruckIcon className="h-4 w-4 shrink-0 text-accent" />
              {shippingMessage}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-accent/15">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>

          {/* items grouped by studio */}
          <div className="flex-1 divide-y divide-border px-5">
            {groups.map((group) => {
              const vendor = getVendor(group.vendorId)
              return (
                <div key={group.vendorId} className="py-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    <StoreIcon className="h-3.5 w-3.5" />
                    {vendor?.name ?? 'AmbalaEshop'}
                  </p>
                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex gap-3">
                        <Link
                          to={`/product/${item.productId}`}
                          onClick={onClose}
                          className="h-18 w-16 shrink-0 overflow-hidden rounded-xl bg-accent-soft"
                        >
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              to={`/product/${item.productId}`}
                              onClick={onClose}
                              className="line-clamp-2 text-sm font-semibold text-ink hover:text-accent"
                            >
                              {item.name}
                            </Link>
                            <span className="shrink-0 text-sm font-bold text-ink tabular-nums">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-caption text-ink-mute">
                            {item.size} · {item.color}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <PillStepper value={item.quantity} onChange={(q) => updateQuantity(item.key, q)} />
                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              className="flex items-center gap-1 text-caption text-ink-mute transition-colors hover:text-danger"
                            >
                              <LuTrash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* summary */}
          <div className="sticky bottom-0 border-t border-border bg-surface-sunken px-5 pb-5 pt-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-bold text-ink tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className={cn('font-semibold tabular-nums', totals.shipping === 0 ? 'text-accent' : 'text-ink')}>
                  {totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-caption text-ink-mute">Taxes calculated at checkout.</p>

            <div className="mt-4 grid gap-2">
              <Link
                to="/checkout"
                onClick={onClose}
                className="flex h-12 items-center justify-between rounded-full bg-accent pl-5 pr-1.5 text-sm font-semibold text-on-accent shadow-[0_10px_24px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover"
              >
                <span className="flex items-center gap-2">
                  <LuLock className="h-4 w-4" />
                  Checkout
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1.5 tabular-nums">{formatPrice(payable)}</span>
              </Link>
              <Link
                to="/cart"
                onClick={onClose}
                className="flex h-12 items-center justify-center rounded-full border border-border-strong bg-surface text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                View cart
              </Link>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}

