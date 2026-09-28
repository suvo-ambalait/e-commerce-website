import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LuArrowLeft, LuBan, LuMapPin, LuPhone, LuRotateCcw, LuTruck, LuWallet } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Badge, Button, ButtonLink } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatDateLong, formatPrice } from '@/shared/lib/format'
import type { Shipment } from '@/shared/types'
import { returnsStore, type ReturnKind } from '@/features/marketplace/stores'
import { returnTone } from '@/features/marketplace/labels'
import { paymentLabel } from '@/features/checkout/components/checkoutForms'
import { AccountCard } from '../components/AccountLayout'
import { ParcelCard } from '../components/ParcelCard'
import { ReturnRequestModal } from '../components/ReturnRequestModal'
import { formatAddress, orderProgress, progressTone, useCustomer } from '../lib/useCustomer'

/** days after delivery a customer can still ask for a return */
const RETURN_WINDOW_DAYS = 7

export function AccountOrderDetailPage() {
  const { orderNumber = '' } = useParams()
  useDocumentTitle(`Order ${orderNumber} · AmbalaEshop`)
  const { orders, profile } = useCustomer()
  const [returns] = returnsStore.useStore()
  const [request, setRequest] = useState<{ kind: ReturnKind; shipment: Shipment } | null>(null)

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
  // no delivery date is stored yet, so allow the return window plus a week for delivery
  const withinWindow =(Date.now() - new Date(order.date).getTime()) / 86_400_000 <= RETURN_WINDOW_DAYS + 7

  const parcelFooter = (s: Shipment) => {
    const existing = returns.find((r) => r.orderNumber === order.orderNumber && r.vendorId === s.vendorId && r.status !== 'Rejected')
    if (existing) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-ink-soft">
            {existing.kind === 'cancel' ? 'Cancellation' : 'Return'} requested {formatDate(existing.createdAt)}
            {existing.note && <span className="block text-caption text-ink-mute">“{existing.note}”</span>}
          </span>
          <Badge tone={returnTone[existing.status]}>{existing.status}</Badge>
        </div>
      )
    }
    if (s.status === 'Processing') {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-caption text-ink-mute">Not shipped yet — you can still cancel.</span>
          <Button variant="ghost" size="sm" onClick={() => setRequest({ kind: 'cancel', shipment: s })}>
            <LuBan className="h-3.5 w-3.5" />
            Cancel parcel
          </Button>
        </div>
      )
    }
    if (s.status === 'Delivered' && withinWindow) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-caption text-ink-mute">Returns accepted within {RETURN_WINDOW_DAYS} days of delivery.</span>
          <Button variant="secondary" size="sm" onClick={() => setRequest({ kind: 'return', shipment: s })}>
            <LuRotateCcw className="h-3.5 w-3.5" />
            Request a return
          </Button>
        </div>
      )
    }
    return undefined
  }

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
            <ParcelCard key={s.vendorId} shipment={s} footer={parcelFooter(s)} />
          ))}
        </div>

        <div className="space-y-4 xl:sticky xl:top-28">
          <AccountCard title="Summary">
            <dl className="space-y-1.5 text-sm">
              <Line label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Line label={order.discountCode ? `Discount (${order.discountCode})` : 'Discount'} value={`−${formatPrice(order.discount)}`} accent />
              )}
              <Line label="Delivery" value={order.shipping === 0 ? 'Free' : formatPrice(order.shipping)} />
              <Line label="Tax" value={formatPrice(order.tax)} />
              <div className="mt-2 border-t border-border pt-2">
                <Line label="Total" value={formatPrice(order.grandTotal)} strong />
              </div>
            </dl>
          </AccountCard>

          <AccountCard title="Payment">
            {order.payment ? (
              <div className="flex items-start gap-2.5 text-sm">
                <LuWallet className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{paymentLabel[order.payment.method]}</p>
                  {order.payment.reference && <p className="text-caption text-ink-mute">Ref. {order.payment.reference}</p>}
                </div>
                <Badge tone={order.payment.status === 'Paid' ? 'success' : 'warning'}>{order.payment.status}</Badge>
              </div>
            ) : (
              <p className="text-sm text-ink-mute">Paid by card.</p>
            )}
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
              {order.zoneName && (
                <li className="flex items-center gap-2.5">
                  <LuTruck className="h-4 w-4 shrink-0 text-accent" />
                  {order.zoneName}
                </li>
              )}
            </ul>
          </AccountCard>
        </div>
      </div>

      {request && (
        <ReturnRequestModal
          open
          onClose={() => setRequest(null)}
          kind={request.kind}
          order={order}
          shipment={request.shipment}
          customerName={profile.name}
        />
      )}
    </div>
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
