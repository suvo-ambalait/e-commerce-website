import { Link } from 'react-router-dom'
import { PageHeader, StatCard, StatGrid, FadeItem, DataTable, type Column } from '../components/primitives'
import { CoinIcon, ReceiptIcon, StorefrontIcon, AlertIcon } from '../components/icons'
import { AreaChart, BarChart, Badge, BreakdownBars, ButtonLink } from '@/shared/ui'
import { formatDate, formatPrice, formatPriceWhole } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useSettings } from '../context/SettingsContext'
import { ordersByDay, revenueSeries } from '@/features/orders/lib/analytics'
import type { Order } from '@/shared/types'

export function AdminDashboard() {
  const { orders } = useOrders()
  const { products, categories } = useCatalog()
  const { statusFor } = useInventory()
  const { vendors, getVendor } = useVendors()
  const { settings } = useSettings()

  const revenue = revenueSeries(orders, 14)
  const dayBars = ordersByDay(orders)
  const gmv = orders.reduce((s, o) => s + o.grandTotal, 0)
  const commission = orders.reduce(
    (s, o) => s + o.shipments.reduce((n, sh) => n + (sh.subtotal - sh.discount) * settings.commissionRate, 0),
    0,
  )
  const pending = vendors.filter((v) => v.status === 'pending')
  const lowStock = products.filter((p) => statusFor(p) !== 'in')

  const catSales = categories
    .map((c) => ({
      label: c.name,
      value: orders
        .flatMap((o) => o.shipments)
        .flatMap((s) => s.items)
        .filter((i) => i.category === c.name)
        .reduce((n, i) => n + i.price * i.quantity, 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const topVendors = [...vendors]
    .filter((v) => v.status === 'active')
    .map((v) => ({
      label: v.name,
      value: products.filter((p) => p.vendorId === v.id).length,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const columns: Column<Order>[] = [
    { header: 'Order', cell: (o) => <span className="font-medium text-ink">{o.orderNumber}</span> },
    { header: 'Date', cell: (o) => formatDate(o.date), hideBelow: 'sm' },
    { header: 'Customer', cell: (o) => o.email, hideBelow: 'md' },
    {
      header: 'Makers',
      cell: (o) => (
        <div className="flex flex-wrap gap-1">
          {o.shipments.map((s) => (
            <Badge key={s.vendorId} tone="neutral">
              {getVendor(s.vendorId)?.name.split(' ')[0]}
            </Badge>
          ))}
        </div>
      ),
      hideBelow: 'md',
    },
    { header: 'Total', cell: (o) => formatPrice(o.grandTotal) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Marketplace health at a glance." />

      <StatGrid>
        <FadeItem>
          <StatCard
            label="GMV (14d)"
            value={formatPriceWhole(gmv || revenue.reduce((s, r) => s + r.value, 0))}
            spark={revenue.map((r) => r.value)}
            delta={{ value: '8.2%', positive: true }}
            icon={CoinIcon}
          />
        </FadeItem>
        <FadeItem>
          <StatCard label="Commission" value={formatPriceWhole(commission)} hint={`${Math.round(settings.commissionRate * 100)}% take rate`} icon={ReceiptIcon} />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Active vendors"
            value={String(vendors.filter((v) => v.status === 'active').length)}
            hint={`${pending.length} pending review`}
            icon={StorefrontIcon}
          />
        </FadeItem>
        <FadeItem>
          <StatCard label="Low / out of stock" value={String(lowStock.length)} hint="across all makers" icon={AlertIcon} />
        </FadeItem>
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-ink">Revenue, last 14 days</h3>
          <AreaChart className="mt-3" data={revenue} valueFormat={(n) => formatPrice(n)} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="text-sm font-medium text-ink">Orders by weekday</h3>
          <BarChart className="mt-4" data={dayBars} height={150} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-ink">Sales by category</h3>
          <BreakdownBars data={catSales} valueFormat={(n) => formatPrice(n)} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-ink">Catalogue by vendor</h3>
          <BreakdownBars data={topVendors} valueFormat={(n) => `${n} pieces`} />
        </div>
      </div>

      {pending.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning-soft/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              {pending.length} vendor application{pending.length > 1 ? 's' : ''} awaiting review
            </p>
            <ButtonLink to="/admin/vendors" size="sm" variant="secondary">
              Review
            </ButtonLink>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink">Recent orders</h3>
          <Link to="/admin/orders" className="text-caption text-accent hover:underline">
            All orders
          </Link>
        </div>
        <DataTable rows={orders} columns={columns} keyOf={(o) => o.orderNumber} empty="No orders yet." pageSize={6} />
      </div>
    </div>
  )
}
