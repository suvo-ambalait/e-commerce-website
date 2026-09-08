import { Link } from 'react-router-dom'
import { Badge, Select } from '@/shared/ui'
import { formatDateLong, formatPrice } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Order, ShipmentStatus } from '@/shared/types'

const statuses: ShipmentStatus[] = ['Processing', 'Shipped', 'Delivered', 'Cancelled']

const tone: Record<ShipmentStatus, Parameters<typeof Badge>[0]['tone']> = {
  Processing: 'warning',
  Shipped: 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
}

export function OrderDetailView({
  order,
  scopeVendorId,
  onStatusChange,
  backTo,
}: {
  order: Order
  /** when set, only this vendor's shipment is shown/editable (vendor view) */
  scopeVendorId?: string
  onStatusChange: (vendorId: string, status: ShipmentStatus) => void
  backTo: string
}) {
  const { getVendor } = useVendors()
  const shipments = scopeVendorId
    ? order.shipments.filter((s) => s.vendorId === scopeVendorId)
    : order.shipments

  return (
    <div className="space-y-6">
      <Link to={backTo} className="text-caption text-accent hover:underline">
        ← All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-ink-mute">
            Placed {formatDateLong(order.date)} · {order.email}
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl text-ink">{formatPrice(order.grandTotal)}</p>
          {order.discountCode && <Badge tone="accent">{order.discountCode}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="text-caption uppercase tracking-wide text-ink-mute">Ship to</p>
          <p className="mt-1.5 leading-relaxed text-ink-soft">
            {order.shippingInfo.fullName}
            <br />
            {order.shippingInfo.address}
            <br />
            {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zip}
            <br />
            {order.shippingInfo.country}
            <br />
            {order.shippingInfo.phone}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="text-caption uppercase tracking-wide text-ink-mute">Totals</p>
          <dl className="mt-1.5 space-y-1 text-ink-soft">
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            {order.discount > 0 && <Row label="Discount" value={`−${formatPrice(order.discount)}`} />}
            <Row label="Shipping" value={order.shipping === 0 ? 'Free' : formatPrice(order.shipping)} />
            <Row label="Tax" value={formatPrice(order.tax)} />
            <Row label="Total" value={formatPrice(order.grandTotal)} strong />
          </dl>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="text-caption uppercase tracking-wide text-ink-mute">Fulfilment</p>
          <div className="mt-1.5 space-y-1">
            {shipments.map((s) => (
              <div key={s.vendorId} className="flex items-center justify-between">
                <span className="text-ink-soft">{getVendor(s.vendorId)?.name}</span>
                <Badge tone={tone[s.status]}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {shipments.map((shipment, i) => {
        const vendor = getVendor(shipment.vendorId)
        return (
          <div key={shipment.vendorId} className="rounded-lg border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {vendor ? (
                    <Link to={`/vendor/${vendor.slug}`} className="hover:underline">
                      {vendor.name}
                    </Link>
                  ) : (
                    'MorerDokan'
                  )}
                </p>
                <p className="text-caption text-ink-mute">
                  Parcel {i + 1} of {order.shipments.length}
                </p>
              </div>
              <Select
                size="sm"
                value={shipment.status}
                onChange={(v) => onStatusChange(shipment.vendorId, v as ShipmentStatus)}
                options={statuses.map((st) => ({ value: st, label: st }))}
                className="w-40"
              />
            </div>
            <ul className="divide-y divide-border">
              {shipment.items.map((item) => (
                <li key={item.key} className="flex items-center gap-3 px-4 py-3">
                  <img src={item.image} alt="" className="h-14 w-12 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.productId}`} className="text-sm text-ink hover:underline">
                      {item.name}
                    </Link>
                    <p className="text-caption text-ink-mute">
                      {item.color} · {item.size} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-ink">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-6 border-t border-border px-4 py-2.5 text-caption text-ink-mute">
              <span>Shipping {shipment.shipping === 0 ? 'free' : formatPrice(shipment.shipping)}</span>
              <span>Tax {formatPrice(shipment.tax)}</span>
              <span className="text-ink">Parcel total {formatPrice(shipment.total)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'border-t border-border pt-1 font-medium text-ink' : ''}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
