import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { IconType } from 'react-icons'
import { LuCheck, LuHouse, LuPackage, LuStore, LuTruck, LuX } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Shipment } from '@/shared/types'
import { AccountCard } from './AccountLayout'
import { shipmentSteps } from '../lib/useCustomer'

/** icon shown inside each tracker step */
const stepIcon: Record<string, IconType> = {
  Processing: LuPackage,
  Shipped: LuTruck,
  Delivered: LuHouse,
}

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
          This parcel was cancelled. You will not pay for it.
        </p>
      ) : (
        <ol className="grid grid-cols-3 rounded-2xl bg-surface-sunken/60 px-2 py-4" aria-label="Delivery progress">
          {shipmentSteps.map((step, i) => {
            const done = i <= reached
            const current = i === reached && i < shipmentSteps.length - 1
            return (
              <li
                key={step}
                className="relative flex flex-col items-center text-center"
                aria-current={i === reached ? 'step' : undefined}
              >
                {/* connector from the previous step; z-0 keeps it under every circle */}
                {i > 0 && (
                  <span
                    className="absolute right-1/2 top-4 z-0 h-1 w-full -translate-y-1/2 overflow-hidden rounded-full bg-border"
                    aria-hidden
                  >
                    <span
                      className={cn(
                        'block h-full origin-left rounded-full bg-accent transition-transform duration-700',
                        done ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </span>
                )}
                <span className="relative z-10 flex h-8 w-8 items-center justify-center">
                  {current && <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" aria-hidden />}
                  <span
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-surface-sunken',
                      done
                        ? 'bg-accent text-on-accent shadow-[0_6px_14px_rgba(109,40,217,0.3)]'
                        : 'border-2 border-border-strong! bg-surface text-ink-mute',
                    )}
                  >
                    {(() => {
                      const Icon = stepIcon[step] ?? LuCheck
                      return <Icon className="h-4 w-4" aria-hidden />
                    })()}
                  </span>
                </span>
                <span className={cn('mt-2 text-caption font-semibold', done ? 'text-ink' : 'text-ink-mute')}>{step}</span>
                {current && <span className="text-[11px] font-medium text-accent">Now</span>}
              </li>
            )
          })}
        </ol>
      )}

      <ul className="mt-4 divide-y divide-border">
        {shipment.items.map((item) => (
          <li key={item.key} className="flex items-center gap-3.5 py-3">
            <Link to={`/product/${item.productId}`} className="group shrink-0 overflow-hidden rounded-xl ring-1 ring-border">
              <img
                src={item.image}
                alt=""
                className="h-16 w-16 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/product/${item.productId}`} className="line-clamp-1 text-sm font-semibold text-ink hover:text-accent">
                {item.name}
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-caption text-ink-mute">
                {[item.color, item.size].filter(Boolean).map((v) => (
                  <span key={v} className="rounded-md bg-surface-sunken px-1.5 py-px">
                    {v}
                  </span>
                ))}
                <span>
                  Qty <span className="font-semibold text-ink-soft tabular-nums">{item.quantity}</span>
                  {item.quantity > 1 && <span className="tabular-nums"> × {formatPrice(item.price)}</span>}
                </span>
              </p>
            </div>
            <p className="text-sm font-semibold text-ink tabular-nums">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      {/* how the parcel total adds up */}
      <dl className="mt-1 space-y-1.5 rounded-2xl bg-surface-sunken/60 px-4 py-3 text-caption">
        <BreakdownRow label="Items" value={formatPrice(shipment.subtotal)} />
        {shipment.discount > 0 && (
          <BreakdownRow label="Discount" value={`−${formatPrice(shipment.discount)}`} className="text-success" />
        )}
        <BreakdownRow label="Delivery" value={shipment.shipping === 0 ? 'Free' : formatPrice(shipment.shipping)} />
        {shipment.tax > 0 && <BreakdownRow label="Tax" value={formatPrice(shipment.tax)} />}
        <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-bold text-ink">
          <dt>Parcel total</dt>
          <dd className="tabular-nums">{formatPrice(shipment.total)}</dd>
        </div>
      </dl>

      {footer && <div className="mt-4 border-t border-border pt-4">{footer}</div>}
    </AccountCard>
  )
}

function BreakdownRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between text-ink-soft', className)}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
