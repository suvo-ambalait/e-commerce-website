import { Link } from 'react-router-dom'
import { PageHeader, StatCard, StatGrid, FadeItem, DataTable, type Column } from '@/features/admin/components/primitives'
import { CoinIcon, ReceiptIcon, BoxIcon, AlertIcon } from '@/features/admin/components/icons'
import { AreaChart, BarChart, Badge, ButtonLink } from '@/shared/ui'
import { formatPrice, formatPriceWhole, formatDate } from '@/shared/lib/format'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { ordersByDay, revenueSeries, summariseVendorSales, vendorShipments } from '@/features/orders/lib/analytics'
import type { Order, Shipment } from '@/shared/types'

export function VendorOverview() {
  const vendor = useCurrentVendor()
  const { productsByVendor } = useCatalog()
  const { statusFor } = useInventory()
  const { orders } = useOrders()
  const { settings } = useSettings()

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor profile linked to this account.</p>

  const products = productsByVendor(vendor.id)
  const sales = summariseVendorSales(orders, vendor.id, settings.commissionRate)
  const revenue = revenueSeries(orders, 14, vendor.id)
  const dayBars = ordersByDay(orders, vendor.id)
  const lowStock = products.filter((p) => statusFor(p) !== 'in')
  const recent = vendorShipments(orders, vendor.id).slice(0, 6)

  const columns: Column<{ order: Order; shipment: Shipment }>[] = [
    { header: 'Order', cell: (r) => <span className="font-medium text-ink">{r.order.orderNumber}</span> },
    { header: 'Date', cell: (r) => formatDate(r.order.date), hideBelow: 'sm' },
    { header: 'Items', cell: (r) => r.shipment.items.reduce((n, i) => n + i.quantity, 0), hideBelow: 'sm' },
    { header: 'Value', cell: (r) => formatPrice(r.shipment.total) },
    { header: 'Status', cell: (r) => <Badge tone="neutral">{r.shipment.status}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${vendor.name}`}
        description="A snapshot of your storefront on MorerDokan."
        action={
          <ButtonLink to="/vendor/dashboard/products/new" size="sm">
            Add product
          </ButtonLink>
        }
      />

      <StatGrid>
        <FadeItem>
          <StatCard
            label="Net sales"
            value={formatPriceWhole(sales.net || revenue.reduce((s, r) => s + r.value, 0))}
            spark={revenue.map((r) => r.value)}
            delta={{ value: '6.1%', positive: true }}
            hint={`After ${Math.round(settings.commissionRate * 100)}% commission`}
            icon={CoinIcon}
          />
        </FadeItem>
        <FadeItem>
          <StatCard label="Orders" value={String(sales.orders)} hint={`${sales.units} units sold`} icon={ReceiptIcon} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Live products" value={String(products.length)} icon={BoxIcon} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Low stock" value={String(lowStock.length)} hint="8 units or fewer" icon={AlertIcon} />
        </FadeItem>
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-ink">Your revenue, last 14 days</h3>
          <AreaChart className="mt-3" data={revenue} valueFormat={(n) => formatPrice(n)} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="text-sm font-medium text-ink">Orders by weekday</h3>
          <BarChart className="mt-4" data={dayBars} height={150} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink">Recent orders</h3>
          <Link to="/vendor/dashboard/orders" className="text-caption text-accent hover:underline">
            All orders
          </Link>
        </div>
        <DataTable
          rows={recent}
          columns={columns}
          keyOf={(r) => r.order.orderNumber}
          empty="No orders yet — they’ll appear here the moment a customer checks out."
          pageSize={6}
        />
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning-soft/40 p-4">
          <p className="text-sm font-medium text-ink">Running low</p>
          <ul className="mt-2 space-y-1 text-caption text-ink-soft">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between">
                <Link to={`/vendor/dashboard/products/${p.id}/edit`} className="hover:underline">
                  {p.name}
                </Link>
                <span>{p.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
