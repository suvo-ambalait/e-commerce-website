import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { Button, ButtonLink, Drawer, QuantityStepper } from '@/shared/ui'
import { BagIcon } from '@/shared/ui/icons'
import { formatPrice } from '@/shared/lib/format'

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { groups, items, subtotal, updateQuantity, removeItem } = useCart()
  const { getVendor } = useVendors()

  return (
    <Drawer open={open} onClose={onClose} title={`Cart · ${items.length} item${items.length === 1 ? '' : 's'}`}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <BagIcon className="h-9 w-9 text-border-strong" />
          <p className="text-sm text-ink-soft">Your cart is empty.</p>
          <Button variant="secondary" onClick={onClose}>
            Keep browsing
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-6 px-5 py-5">
            {groups.map((group) => {
              const vendor = getVendor(group.vendorId)
              return (
                <div key={group.vendorId}>
                  <p className="mb-3 text-caption font-medium uppercase tracking-wide text-ink-mute">
                    {vendor?.name ?? 'MorerDokan'}
                  </p>
                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex gap-3">
                        <Link to={`/product/${item.productId}`} onClick={onClose} className="shrink-0">
                          <img src={item.image} alt="" className="h-20 w-16 rounded-sm object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/product/${item.productId}`}
                            onClick={onClose}
                            className="block truncate text-sm text-ink hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-caption text-ink-mute">
                            {item.size} · {item.color}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <QuantityStepper
                              size="sm"
                              value={item.quantity}
                              onChange={(q) => updateQuantity(item.key, q)}
                            />
                            <span className="text-sm tabular-nums text-ink">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="mt-1.5 text-caption text-ink-mute underline-offset-2 hover:text-danger hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-border bg-surface px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-medium tabular-nums text-ink">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-caption text-ink-mute">Shipping &amp; taxes calculated at checkout.</p>
            <div className="mt-3 grid gap-2">
              <ButtonLink to="/checkout" onClick={onClose} fullWidth>
                Checkout
              </ButtonLink>
              <ButtonLink to="/cart" onClick={onClose} variant="secondary" fullWidth>
                View cart
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
