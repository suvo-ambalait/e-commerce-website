import { useVendors } from '@/features/vendor/context/VendorContext'
import { formatPrice } from '@/shared/lib/format'
import { StoreIcon } from '@/shared/ui/icons'
import type { CartItem } from '@/shared/types'
import type { VendorGroup } from '@/features/cart/context/CartContext'
import type { ShipmentTotals } from '@/shared/lib/pricing'

export function ShipmentList({
  groups,
  shipments,
}: {
  groups: VendorGroup[]
  shipments: ShipmentTotals[]
}) {
  const { getVendor } = useVendors()

  return (
    <div className="space-y-3">
      {groups.map((group, i) => {
        const vendor = getVendor(group.vendorId)
        const totals = shipments[i]
        return (
          <div key={group.vendorId} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                <StoreIcon className="h-3.5 w-3.5" />
                {vendor?.name ?? 'AmbalaEshop'}
              </p>
              <p className="text-caption text-ink-mute">
                Parcel {i + 1} of {groups.length}
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {group.items.map((item: CartItem) => (
                <li key={item.key} className="flex items-center gap-3">
                  <span className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-accent-soft">
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {item.name} <span className="text-ink-mute">× {item.quantity}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            {totals && (
              <p className="mt-3 border-t border-border pt-2.5 text-caption text-ink-mute">
                Delivery{' '}
                <span className={totals.shipping === 0 ? 'font-semibold text-accent' : 'font-semibold text-ink'}>
                  {totals.shipping === 0 ? 'free' : formatPrice(totals.shipping)}
                </span>{' '}
                · {vendor?.policies.shipping}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
