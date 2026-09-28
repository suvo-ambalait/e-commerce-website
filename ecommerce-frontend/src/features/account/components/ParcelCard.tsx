import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuCheck, LuStore, LuX } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Shipment } from '@/shared/types'
import { AccountCard } from './AccountLayout'
import { shipmentSteps } from '../lib/useCustomer'

/** One shop's parcel: who sent it, a progress tracker, the items inside, and optional actions. */
export function ParcelCard({ shipment, footer }: { shipment: Shipment; footer?: ReactNode }) {
  const { getVendor } = useVendors()
  const vendor = getVendor(shipment.vendorId)
  const cancelled = shipment.status === 'Cancelled'
  const reached = shipmentSteps.indexOf(shipment.status)

  return (
    <AccountCard
      title={
        <span className="flex items-center gap-2">
          <LuStore className="h-4.5 w-4.5 text-accent" />
          {vendor ? (
            <Link to={`/vendor/${vendor.slug}`} className="hover:text-accent">
              {vendor.name}
            </Link>
          ) : (
            'Shop'
          )}
        </span>
      }
      subtitle={vendor?.policies.shipping}
      aside={<span className="font-display font-bold text-ink tabular-nums">{formatPrice(shipment.total)}</span>}
    >
      {cancelled ? (
        <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          <LuX className="h-4 w-4" />
          This parcel was cancelled. You won’t be charged for it.
        </p>
      ) : (
        <ol className="grid grid-cols-3" aria-label="Delivery progress">
          {shipmentSteps.map((step, i) => {
            const done = i <= reached
            return (
              <li key={step} className="relative flex flex-col items-center text-center">
                {i > 0 && (
                  <span
                    className={cn('absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2', done ? 'bg-accent' : 'bg-border')}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    'relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-surface',
                    done ? 'bg-accent text-on-accent' : 'bg-surface-sunken text-ink-mute',
                  )}
                >
                  {done ? <LuCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn('mt-1.5 text-caption font-semibold', done ? 'text-ink' : 'text-ink-mute')}>{step}</span>
              </li>
            )
          })}
        </ol>
      )}

      <ul className="mt-5 divide-y divide-border border-t border-border">
        {shipment.items.map((item) => (
          <li key={item.key} className="flex items-center gap-3 py-3">
            <Link to={`/product/${item.productId}`} className="shrink-0">
              <img src={item.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/product/${item.productId}`} className="line-clamp-1 text-sm font-semibold text-ink hover:text-accent">
                {item.name}
              </Link>
              <p className="text-caption text-ink-mute">
                {[item.color, item.size].filter(Boolean).join(' · ')}
                {(item.color || item.size) && ' · '}Qty {item.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold text-ink tabular-nums">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      {footer && <div className="mt-2 border-t border-border pt-4">{footer}</div>}
    </AccountCard>
  )
}
