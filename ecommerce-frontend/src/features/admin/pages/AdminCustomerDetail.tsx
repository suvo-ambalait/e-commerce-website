import { Link, useParams } from 'react-router-dom'
import { PageHeader, StatCard } from '../components/primitives'
import { Avatar, Badge, ButtonLink } from '@/shared/ui'
import { formatDateLong, formatPrice } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'

export function AdminCustomerDetail() {
  const { email = '' } = useParams()
  const decoded = decodeURIComponent(email)
  const { orders } = useOrders()
  const { users } = useAuth()

  const account = users.find((u) => u.email === decoded)
  const theirOrders = orders.filter((o) => o.email === decoded)
  const name = account?.name ?? theirOrders[0]?.shippingInfo.fullName ?? decoded.split('@')[0]
  const spent = theirOrders.reduce((s, o) => s + o.grandTotal, 0)

  if (!account && theirOrders.length === 0) {
    return (
      <div>
        <p className="text-sm text-ink-mute">Customer not found.</p>
        <ButtonLink to="/admin/customers" variant="secondary" className="mt-4">
          Back to customers
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/customers" className="text-caption text-accent hover:underline">
        ← All customers
      </Link>

      <div className="flex items-center gap-4">
        <Avatar name={name} size={52} />
        <div>
          <PageHeader title={name} description={decoded} />
          <Badge tone={account?.role === 'admin' ? 'inverse' : account?.role === 'vendor' ? 'accent' : 'neutral'} className="mt-1">
            {account?.role ?? 'customer'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={String(theirOrders.length)} />
        <StatCard label="Lifetime spend" value={formatPrice(spent)} />
        <StatCard
          label="Avg. order"
          value={formatPrice(theirOrders.length ? spent / theirOrders.length : 0)}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ink">Order history</h3>
        {theirOrders.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-ink-mute">
            No orders yet.
          </p>
        ) : (
          <div className="space-y-3">
            {theirOrders.map((order) => (
              <Link
                key={order.orderNumber}
                to={`/admin/orders/${order.orderNumber}`}
                className="block rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{order.orderNumber}</p>
                    <p className="text-caption text-ink-mute">{formatDateLong(order.date)}</p>
                  </div>
                  <p className="font-serif text-lg text-ink">{formatPrice(order.grandTotal)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.shipments.map((s) => (
                    <OrderStatusBadge key={s.vendorId} status={s.status} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
