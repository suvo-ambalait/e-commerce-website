import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LuTrash2 } from 'react-icons/lu'
import { formatPrice } from '@/shared/lib/format'
import { StoreIcon } from '@/shared/ui/icons'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCart, type VendorGroup } from '../context/CartContext'
import { PillStepper } from './PillStepper'

export function CartVendorGroup({ group }: { group: VendorGroup }) {
  const { getVendor } = useVendors()
  const { updateQuantity, removeItem } = useCart()
  const vendor = getVendor(group.vendorId)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <StoreIcon className="h-4 w-4" />
          </span>
          <Link
            to={vendor ? `/vendor/${vendor.slug}` : '#'}
            className="truncate text-sm font-bold text-ink hover:text-accent"
          >
            {vendor?.name ?? 'AmbalaEshop'}
          </Link>
          <span className="hidden shrink-0 text-caption text-ink-mute sm:inline">· Ships separately</span>
        </div>
        <span className="shrink-0 text-caption text-ink-mute">
          Subtotal <span className="font-bold text-ink tabular-nums">{formatPrice(group.subtotal)}</span>
        </span>
      </div>

      <ul className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {group.items.map((item) => (
            <motion.li key={item.key} layout exit={{ opacity: 0, height: 0 }} className="flex gap-4 p-4 sm:p-5">
              <Link
                to={`/product/${item.productId}`}
                className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-accent-soft sm:h-28 sm:w-24"
              >
                <img src={item.image} alt="" className="h-full w-full object-cover" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link
                    to={`/product/${item.productId}`}
                    className="font-display text-base font-bold tracking-[-0.01em] text-ink hover:text-accent sm:text-lg"
                  >
                    {item.name}
                  </Link>
                  <span className="shrink-0 font-display text-base font-bold text-ink tabular-nums sm:text-lg">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
                <p className="mt-0.5 text-caption text-ink-mute">
                  {item.color} · {item.size}
                </p>
                {item.quantity > 1 && (
                  <p className="text-caption text-ink-mute tabular-nums">{formatPrice(item.price)} each</p>
                )}

                <div className="mt-auto flex items-center justify-between pt-3">
                  <PillStepper value={item.quantity} onChange={(q) => updateQuantity(item.key, q)} />
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-border-strong px-3 text-caption font-medium text-ink-soft transition-colors hover:border-danger hover:text-danger"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" />
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
