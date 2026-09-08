import { PageHeader, StatCard, DataTable, type Column } from '@/features/admin/components/primitives'
import { Badge } from '@/shared/ui'
import { formatPrice, formatPriceWhole, formatDate } from '@/shared/lib/format'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { summariseVendorSales, vendorShipments } from '@/features/orders/lib/analytics'
import type { Order, Shipment } from '@/shared/types'

export function VendorPayouts() {
  const vendor = useCurrentVendor()
  const { orders } = useOrders()
  const { settings } = useSettings()

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const rate = settings.commissionRate
  const sales = summariseVendorSales(orders, vendor.id, rate)
  const rows = vendorShipments(orders, vendor.id)

  const columns: Column<{ order: Order; shipment: Shipment }>[] = [
    { header: 'Order', cell: (r) => <span className="font-medium text-ink">{r.order.orderNumber}</span> },
    { header: 'Date', cell: (r) => formatDate(r.order.date), hideBelow: 'sm' },
    { header: 'Gross', cell: (r) => formatPrice(r.shipment.subtotal - r.shipment.discount) },
    {
      header: 'Commission',
      cell: (r) => `−${formatPrice((r.shipment.subtotal - r.shipment.discount) * rate)}`,
      hideBelow: 'sm',
    },
    {
      header: 'You receive',
      cell: (r) => formatPrice((r.shipment.subtotal - r.shipment.discount) * (1 - rate)),
    },
    {
      header: 'Payout',
      cell: (r) =>
        r.shipment.status === 'Delivered' ? (
          <Badge tone="success">Released</Badge>
        ) : (
          <Badge tone="neutral">On delivery</Badge>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description={`MorerDokan takes a flat ${Math.round(rate * 100)}% commission. Funds release once a parcel is marked delivered.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lifetime gross" value={formatPriceWhole(sales.gross)} />
        <StatCard label="Commission" value={formatPriceWhole(sales.commission)} hint={`${Math.round(rate * 100)}%`} />
        <StatCard label="Available to withdraw" value={formatPriceWhole(sales.pendingPayout)} />
      </div>

      <DataTable rows={rows} columns={columns} keyOf={(r) => `${r.order.orderNumber}-p`} empty="No sales yet." />
    </div>
  )
}
