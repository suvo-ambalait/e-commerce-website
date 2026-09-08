import { useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ButtonLink, Container, Section } from '@/shared/ui'
import { CheckIcon } from '@/shared/ui/icons'
import { formatPrice } from '@/shared/lib/format'
import { easeEditorial } from '@/shared/lib/motion'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useVendors } from '@/features/vendor/context/VendorContext'

export function OrderConfirmationPage() {
  useDocumentTitle('Order confirmed · MorerDokan')
  const location = useLocation()
  const { orders } = useOrders()
  const { getVendor } = useVendors()
  const orderNumber = (location.state as { orderNumber?: string } | null)?.orderNumber
  const order = orders.find((o) => o.orderNumber === orderNumber) ?? orders[0]

  if (!order) {
    return (
      <Section>
        <Container size="narrow" className="text-center">
          <h1 className="text-2xl text-ink">No recent order</h1>
          <ButtonLink to="/shop" className="mt-5">
            Back to shop
          </ButtonLink>
        </Container>
      </Section>
    )
  }

  return (
    <Section>
      <Container size="narrow">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: easeEditorial }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft"
        >
          <CheckIcon className="h-7 w-7 text-success" />
        </motion.div>

        <h1 className="mt-6 text-center text-3xl text-ink">Order confirmed</h1>
        <p className="mt-2 text-center text-sm text-ink-soft">
          {order.orderNumber} · a receipt is on its way to {order.email}. Each maker packs and ships
          their own parcel, so expect {order.shipments.length}{' '}
          {order.shipments.length === 1 ? 'delivery' : 'separate deliveries'}.
        </p>

        <div className="mt-8 space-y-4">
          {order.shipments.map((shipment) => {
            const vendor = getVendor(shipment.vendorId)
            return (
              <div key={shipment.vendorId} className="rounded-lg border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{vendor?.name ?? 'MorerDokan'}</p>
                  <span className="text-caption text-ink-mute">{shipment.status}</span>
                </div>
                <ul className="mt-3 divide-y divide-border">
                  {shipment.items.map((item) => (
                    <li key={item.key} className="flex items-center gap-3 py-2.5">
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
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface-sunken/60 p-5 text-sm">
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          {order.discount > 0 && <Row label="Discount" value={`−${formatPrice(order.discount)}`} />}
          <Row label="Shipping" value={order.shipping === 0 ? 'Free' : formatPrice(order.shipping)} />
          <Row label="Tax" value={formatPrice(order.tax)} />
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium text-ink">
            <span>Total paid</span>
            <span className="font-serif text-lg">{formatPrice(order.grandTotal)}</span>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink to="/account">View orders</ButtonLink>
          <ButtonLink to="/shop" variant="secondary">
            Keep shopping
          </ButtonLink>
        </div>
      </Container>
    </Section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-ink-soft">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
