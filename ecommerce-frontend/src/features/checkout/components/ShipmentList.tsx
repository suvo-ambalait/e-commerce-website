import { useVendors } from '@/features/vendor/context/VendorContext'
import { formatPrice } from '@/shared/lib/format'
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
    <div className="space-y-4">
      {groups.map((group, i) => {
        const vendor = getVendor(group.vendorId)
        const totals = shipments[i]
        return (
          <div key={group.vendorId} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">{vendor?.name ?? 'MorerDokan'}</p>
              <p className="text-caption text-ink-mute">
                Parcel {i + 1} of {groups.length}
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {group.items.map((item: CartItem) => (
                <li key={item.key} className="flex items-center gap-3">
                  <img src={item.image} alt="" className="h-12 w-10 rounded-sm object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-sm tabular-nums text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            {totals && (
              <p className="mt-3 border-t border-border pt-2 text-caption text-ink-mute">
                Shipping {totals.shipping === 0 ? 'free' : formatPrice(totals.shipping)} ·{' '}
                {vendor?.policies.shipping}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
