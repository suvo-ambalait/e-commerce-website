import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { QuantityStepper } from '@/shared/ui'
import { formatPrice } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCart, type VendorGroup } from '../context/CartContext'

export function CartVendorGroup({ group }: { group: VendorGroup }) {
  const { getVendor } = useVendors()
  const { updateQuantity, removeItem } = useCart()
  const vendor = getVendor(group.vendorId)

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <Link
          to={vendor ? `/vendor/${vendor.slug}` : '#'}
          className="text-sm font-medium text-ink underline-offset-2 hover:underline"
        >
          {vendor?.name ?? 'MorerDokan'}
        </Link>
        <span className="text-caption text-ink-mute">Subtotal {formatPrice(group.subtotal)}</span>
      </div>

      <ul className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {group.items.map((item) => (
            <motion.li
              key={item.key}
              layout
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-4 p-4 sm:p-5"
            >
              <Link to={`/product/${item.productId}`} className="shrink-0">
                <img src={item.image} alt="" className="h-24 w-20 rounded-sm object-cover sm:h-28 sm:w-24" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link to={`/product/${item.productId}`} className="text-sm text-ink hover:underline">
                    {item.name}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
                <p className="mt-0.5 text-caption text-ink-mute">
                  {item.color} · {item.size}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    onChange={(q) => updateQuantity(item.key, q)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-caption text-ink-mute underline-offset-2 hover:text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
