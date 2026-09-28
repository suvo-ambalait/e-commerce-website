import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LuArrowLeft, LuMail, LuMapPin, LuPhone } from 'react-icons/lu'
import { PageHeader, StatCard } from '@/features/admin/components/primitives'
import { Pill } from '@/features/admin/components/TableKit'
import { Avatar, ButtonLink } from '@/shared/ui'
import { formatDateLong, formatPrice } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { vendorShipments } from '@/features/orders/lib/analytics'
import { shipmentTone } from '@/features/orders/lib/status'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { summariseVendorCustomers } from './VendorCustomers'

export function VendorCustomerDetail() {
  const vendor = useCurrentVendor()
  const { email = '' } = useParams()
  const decoded = decodeURIComponent(email)
  const { orders } = useOrders()

  // only this customer's parcels from this shop, newest first
  const parcels = useMemo(
    () =>
      vendor
        ? vendorShipments(orders, vendor.id)
            .filter((r) => r.order.email === decoded)
            .sort((a, b) => b.order.date.localeCompare(a.order.date))
        : [],
    [vendor, orders, decoded],
  )

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const customer = summariseVendorCustomers(parcels)[0]
  if (!customer) {
    return (
      <div>
        <p className="text-sm text-ink-mute">This customer hasn’t ordered from your shop.</p>
        <ButtonLink to="/vendor/dashboard/customers" variant="secondary" className="mt-4">
          Back to customers
        </ButtonLink>
      </div>
    )
  }

  // contact details from the most recent order
  const latest = parcels[0].order.shippingInfo
  const address = [latest.address, latest.city, latest.state, latest.zip, latest.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-5">
      <Link to="/vendor/dashboard/customers" className="inline-flex items-center gap-1.5 text-caption font-semibold text-accent hover:underline">
        <LuArrowLeft className="h-3.5 w-3.5" />
        All customers
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={customer.name} size={52} />
        <div className="min-w-0 flex-1">
          <PageHeader title={customer.name} description={customer.orders > 1 ? 'Repeat customer' : 'New customer'} />
        </div>
        <a
          href={`mailto:${customer.email}`}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50!"
        >
          <LuMail className="h-4 w-4" />
          Email customer
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders from you" value={String(customer.orders)} />
        <StatCard label="Spent with you" value={formatPrice(customer.spent)} />
        <StatCard label="Avg. order" value={formatPrice(customer.spent / customer.orders)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 font-display! text-base font-bold! tracking-[-0.01em]! text-ink">Order history</h3>
          <ul className="divide-y divide-border">
            {parcels.map(({ order, shipment }) => (
              <li key={order.orderNumber}>
                <Link
                  to={`/vendor/dashboard/orders/${order.orderNumber}`}
                  className="group flex flex-wrap items-center gap-3 py-3"
                >
                  <div className="flex -space-x-2">
                    {shipment.items.slice(0, 3).map((i) => (
                      <img key={i.key} src={i.image} alt="" title={i.name} className="h-9 w-9 rounded-lg object-cover ring-2 ring-surface" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-ink group-hover:text-accent">{order.orderNumber}</p>
                    <p className="text-caption text-ink-mute">
                      {formatDateLong(order.date)} · {shipment.items.reduce((n, i) => n + i.quantity, 0)} items
                    </p>
                  </div>
                  <Pill tone={shipmentTone[shipment.status]} dot>
                    {shipment.status}
                  </Pill>
                  <p className="w-24 text-right font-bold text-ink tabular-nums">{formatPrice(shipment.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 font-display! text-base font-bold! tracking-[-0.01em]! text-ink">Contact</h3>
          <ul className="space-y-3 text-sm text-ink-soft">
            <ContactRow icon={<LuMail className="h-4 w-4" />} value={customer.email} />
            <ContactRow icon={<LuPhone className="h-4 w-4" />} value={latest.phone} />
            <ContactRow icon={<LuMapPin className="h-4 w-4" />} value={address} />
          </ul>
          <p className="mt-4 text-caption text-ink-mute">From their most recent order.</p>
        </section>
      </div>
    </div>
  )
}

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-accent">{icon}</span>
      <span className="min-w-0 wrap-break-word">{value || '—'}</span>
    </li>
  )
}
