import { Link, useParams } from 'react-router-dom'
import { LuArrowLeft, LuCheck, LuMapPin, LuPhone, LuStore, LuX } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Badge, ButtonLink } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatDateLong, formatPrice } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Shipment } from '@/shared/types'
import { AccountCard } from '../components/AccountLayout'
import { formatAddress, orderProgress, progressTone, shipmentSteps, useCustomer } from '../lib/useCustomer'

export function AccountOrderDetailPage() {
  const { orderNumber = '' } = useParams()
  useDocumentTitle(`Order ${orderNumber} · AmbalaEshop`)
  const { orders } = useCustomer()
  // only the customer's own orders can be opened here
  const order = orders.find((o) => o.orderNumber === orderNumber)

  if (!order) {
    return (
      <AccountCard title="Order not found">
        <p className="text-sm text-ink-mute">We couldn’t find this order in your account.</p>
        <ButtonLink to="/account/orders" variant="secondary" className="mt-4">
          Back to your orders
        </ButtonLink>
      </AccountCard>
    )
  }

  const progress = orderProgress(order)
  const ship = order.shippingInfo

  return (
    <div className="space-y-5">
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-caption font-semibold text-accent hover:underline">
        <LuArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <AccountCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display! text-2xl font-extrabold! tracking-[-0.03em]! text-ink">{order.orderNumber}</h2>
              <Badge tone={progressTone[progress]}>{progress}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-mute">Placed {formatDateLong(order.date)}</p>
          </div>
          <div className="text-right">
            <p className="text-caption text-ink-mute">Order total</p>
            <p className="font-display text-2xl font-extrabold text-ink tabular-nums">{formatPrice(order.grandTotal)}</p>
          </div>
        </div>
      </AccountCard>

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem] xl:items-start">
        <div className="space-y-4">
          {order.shipments.map((s) => (
            <ParcelCard key={s.vendorId} shipment={s} />
          ))}
        </div>

        <div className="space-y-4 xl:sticky xl:top-28">
          <AccountCard title="Summary">
            <dl className="space-y-1.5 text-sm">
              <Line label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Line label={order.discountCode ? `Discount (${order.discountCode})` : 'Discount'} value={`−${formatPrice(order.discount)}`} accent />
              )}
              <Line label="Shipping" value={order.shipping === 0 ? 'Free' : formatPrice(order.shipping)} />
              <Line label="Tax" value={formatPrice(order.tax)} />
              <div className="mt-2 border-t border-border pt-2">
                <Line label="Total" value={formatPrice(order.grandTotal)} strong />
              </div>
            </dl>
          </AccountCard>

          <AccountCard title="Delivery">
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li className="flex items-start gap-2.5">
                <LuMapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  <span className="block font-semibold text-ink">{ship.fullName}</span>
                  {formatAddress(ship)}
                </span>
              </li>
              {ship.phone && (
                <li className="flex items-center gap-2.5">
                  <LuPhone className="h-4 w-4 shrink-0 text-accent" />
                  {ship.phone}
                </li>
              )}
            </ul>
          </AccountCard>
        </div>
      </div>
    </div>
  )
}

/** One shop's parcel: who sent it, a progress tracker, and the items inside. */
function ParcelCard({ shipment }: { shipment: Shipment }) {
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
      {/* tracker */}
      {cancelled ? (
        <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          <LuX className="h-4 w-4" />
          This parcel was cancelled. You won’t be charged for it.
        </p>
      ) : (
        <ol className="grid grid-cols-3">
          {shipmentSteps.map((step, i) => {
            const done = i <= reached
            return (
              <li key={step} className="relative flex flex-col items-center text-center">
                {i > 0 && (
                  <span
                    className={cn('absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2', i <= reached ? 'bg-accent' : 'bg-border')}
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

      {/* items */}
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
    </AccountCard>
  )
}

function Line({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? 'font-semibold text-ink' : 'text-ink-mute'}>{label}</dt>
      <dd className={cn('tabular-nums', strong ? 'font-display text-lg font-bold text-ink' : accent ? 'text-accent' : 'text-ink-soft')}>
        {value}
      </dd>
    </div>
  )
}
