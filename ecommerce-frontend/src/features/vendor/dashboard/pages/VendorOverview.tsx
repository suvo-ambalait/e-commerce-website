import { Link } from 'react-router-dom'
import { LuBoxes, LuPackageCheck, LuPlus, LuReceipt, LuTicketPercent, LuWallet } from 'react-icons/lu'
import { PageHeader, Panel, StatCard, StatGrid, FadeItem, DataTable, type Column } from '@/features/admin/components/primitives'
import { Pill } from '@/features/admin/components/TableKit'
import { CoinIcon, ReceiptIcon, BoxIcon, AlertIcon } from '@/features/admin/components/icons'
import {
  AllClear,
  AttentionRow,
  CustomerCell,
  DateCell,
  LatestValue,
  MetaChip,
  OpenCountPill,
  OrderCell,
  PanelLink,
  QuickActions,
  SectionButtonLink,
  SectionHeader,
  SummaryStrip,
  ThumbStack,
  weekdayInsights,
} from '@/features/admin/components/DashboardWidgets'
import { AreaChart, BarChart } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatPrice, formatPriceWhole, formatDate } from '@/shared/lib/format'
import { shipmentTone } from '@/features/orders/lib/status'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { ordersByDay, revenueSeries, summariseVendorSales, vendorShipments } from '@/features/orders/lib/analytics'
import type { Order, Shipment } from '@/shared/types'

const DAYS = 14
const sum = (xs: { value: number }[]) => xs.reduce((n, x) => n + x.value, 0)

export function VendorOverview() {
  const vendor = useCurrentVendor()
  const { productsByVendor } = useCatalog()
  const { statusFor } = useInventory()
  const { orders } = useOrders()
  const { settings } = useSettings()

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor profile linked to this account.</p>

  const products = productsByVendor(vendor.id)
  const sales = summariseVendorSales(orders, vendor.id, settings.commissionRate)
  const shipments = vendorShipments(orders, vendor.id)

  // revenue + change vs the previous period
  const revenue = revenueSeries(orders, DAYS, vendor.id)
  const prior = revenueSeries(orders, DAYS * 2, vendor.id).slice(0, DAYS)
  const periodChange = sum(prior) ? (sum(revenue) - sum(prior)) / sum(prior) : null
  const latestRev = revenue[revenue.length - 1].value
  const prevRev = revenue.length > 1 ? revenue[revenue.length - 2].value : 0
  const dayChange = prevRev ? (latestRev - prevRev) / prevRev : null

  // weekday
  const dayBars = ordersByDay(orders, vendor.id)
  const weekday = weekdayInsights(dayBars)

  // stock + tasks
  const lowStock = products.filter((p) => statusFor(p) !== 'in')
  const outCount = lowStock.filter((p) => statusFor(p) === 'out').length
  const lowCount = lowStock.length - outCount
  const toShip = shipments.filter((r) => r.shipment.status === 'Processing')
  const openTasks = [lowStock.length, toShip.length].filter(Boolean).length
  const drafts = products.filter((p) => p.status === 'draft').length

  // best sellers from this shop's shipments
  const byProduct = new Map<string, { id: string; name: string; image: string; units: number; value: number }>()
  for (const { shipment } of shipments) {
    for (const i of shipment.items) {
      const row = byProduct.get(i.productId) ?? { id: i.productId, name: i.name, image: i.image, units: 0, value: 0 }
      row.units += i.quantity
      row.value += i.price * i.quantity
      byProduct.set(i.productId, row)
    }
  }
  const topProducts = [...byProduct.values()].sort((a, b) => b.value - a.value).slice(0, 5)
  const topMax = Math.max(1, ...topProducts.map((p) => p.value))
  const soldTotal = [...byProduct.values()].reduce((n, p) => n + p.value, 0)

  const recent = [...shipments].sort((a, b) => b.order.date.localeCompare(a.order.date))

  const columns: Column<{ order: Order; shipment: Shipment }>[] = [
    {
      header: 'Order',
      cell: (r) => (
        <OrderCell
          to={`/vendor/dashboard/orders/${r.order.orderNumber}`}
          orderNumber={r.order.orderNumber}
          items={r.shipment.items.reduce((n, i) => n + i.quantity, 0)}
          icon={LuReceipt}
        />
      ),
    },
    { header: 'Date', hideBelow: 'sm', cell: (r) => <DateCell iso={r.order.date} format={formatDate} /> },
    {
      header: 'Customer',
      hideBelow: 'md',
      cell: (r) => <CustomerCell name={r.order.shippingInfo.fullName} email={r.order.email} />,
    },
    {
      header: 'Status',
      hideBelow: 'sm',
      cell: (r) => (
        <Pill tone={shipmentTone[r.shipment.status]} dot>
          {r.shipment.status}
        </Pill>
      ),
    },
    {
      header: 'Value',
      align: 'right',
      cell: (r) => (
        <span className="inline-flex flex-col items-end">
          <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink tabular-nums">
            {formatPrice(r.shipment.total)}
          </span>
          {r.order.payment && (
            <span
              className={cn(
                'text-caption font-medium',
                r.order.payment.status === 'Paid' ? 'text-success' : 'text-ink-mute',
              )}
            >
              {r.order.payment.status}
            </span>
          )}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Hello, ${vendor.name}`}
        description={`A snapshot of your shop on AmbalaEshop · last ${DAYS} days`}
        action={
          <Link
            to="/vendor/dashboard/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
          >
            <LuPlus className="h-4 w-4" />
            Add product
          </Link>
        }
      />

      <StatGrid>
        <FadeItem>
          <StatCard
            label="Net sales"
            value={formatPriceWhole(sales.net)}
            spark={revenue.map((r) => r.value)}
            delta={
              periodChange !== null
                ? { value: `${Math.abs(periodChange * 100).toFixed(1)}%`, positive: periodChange >= 0 }
                : undefined
            }
            hint={`After ${Math.round(settings.commissionRate * 100)}% commission`}
            icon={CoinIcon}
          />
        </FadeItem>
        <FadeItem>
          <StatCard label="Orders" value={String(sales.orders)} hint={`${sales.units} units sold`} icon={ReceiptIcon} />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Products"
            value={String(products.length)}
            hint={drafts ? `${drafts} draft${drafts === 1 ? '' : 's'}` : 'All listed'}
            icon={BoxIcon}
          />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Low / out of stock"
            value={String(lowStock.length)}
            hint={lowStock.length ? `${settings.lowStockThreshold} units or fewer` : 'All stocked'}
            icon={AlertIcon}
            tone={lowStock.length ? 'warning' : 'default'}
            aside={
              lowStock.length > 0 && (
                <Link
                  to="/vendor/dashboard/inventory"
                  className="mb-0.5 inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-caption font-semibold text-ink shadow-sm transition-colors hover:border-accent/50!"
                >
                  Restock
                </Link>
              )
            }
          />
        </FadeItem>
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.75fr_1fr]">
        <Panel
          title="Your revenue"
          subtitle={`Daily sales from your parcels, last ${DAYS} days`}
          aside={<LatestValue value={formatPrice(latestRev)} label={revenue[revenue.length - 1].label} change={dayChange} />}
        >
          <AreaChart
            data={revenue}
            height={260}
            valueFormat={(n) => formatPrice(n)}
            axisFormat={(n) => formatPriceWhole(n)}
            showLatest={false}
          />
        </Panel>

        <Panel title="Orders by weekday" subtitle={weekday.subtitle} className="flex flex-col">
          <BarChart
            data={dayBars}
            height={220}
            className="flex-1"
            valueFormat={(n) => `${n} order${n === 1 ? '' : 's'}`}
          />
          <SummaryStrip
            items={[
              { label: 'Total', value: weekday.total },
              { label: 'Busiest', value: weekday.busiestShort },
              { label: 'Quietest', value: weekday.quietestShort },
            ]}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Best sellers"
          subtitle="Your products by sales"
          className="flex flex-col"
          aside={<PanelLink to="/vendor/dashboard/products">Products</PanelLink>}
        >
          {topProducts.length === 0 ? (
            <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border py-10 text-caption text-ink-mute">
              No sales yet. Your best sellers will show here.
            </p>
          ) : (
            <>
              <ul className="-mx-2 flex flex-1 flex-col justify-around gap-1">
                {topProducts.map((p, i) => {
                  const share = soldTotal ? p.value / soldTotal : 0
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/vendor/dashboard/products/${p.id}/edit`}
                        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-sunken/70"
                      >
                        <span className="relative shrink-0">
                          <img src={p.image} alt="" className="h-11 w-11 rounded-lg object-cover ring-1 ring-border" />
                          <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-bg ring-2 ring-surface tabular-nums">
                            {i + 1}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-accent">
                              {p.name}
                            </span>
                            <span className="shrink-0 text-sm font-bold text-ink tabular-nums">{formatPrice(p.value)}</span>
                          </span>
                          <span className="mt-1.5 flex items-center gap-2.5">
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                              <span
                                className={cn(
                                  'block h-full rounded-full transition-[width] duration-500',
                                  i === 0 ? 'bg-accent' : 'bg-accent/45 group-hover:bg-accent/70',
                                )}
                                style={{ width: `${Math.max(3, (p.value / topMax) * 100)}%` }}
                              />
                            </span>
                            <span className="w-9 shrink-0 text-right text-caption font-semibold text-ink-mute tabular-nums">
                              {Math.round(share * 100)}%
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[11px] text-ink-mute tabular-nums">
                            {p.units} unit{p.units === 1 ? '' : 's'} sold
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-caption text-ink-mute">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  <span className="font-semibold text-ink">{topProducts[0].name}</span> brings in{' '}
                  {Math.round((topProducts[0].value / (soldTotal || 1)) * 100)}% of your sales
                </span>
              </p>
            </>
          )}
        </Panel>

        <Panel
          title="Needs attention"
          subtitle={openTasks ? 'Things waiting on you today' : 'You’re all caught up'}
          className="flex flex-col"
          aside={<OpenCountPill open={openTasks} />}
        >
          <div className="space-y-2.5">
            {toShip.length > 0 && (
              <AttentionRow
                to="/vendor/dashboard/orders"
                tone="accent"
                icon={<LuPackageCheck className="h-4.5 w-4.5" />}
                count={toShip.length}
                title={`Parcel${toShip.length > 1 ? 's' : ''} to ship`}
                text="Pack and send these to customers"
                meta={
                  <ThumbStack
                    items={toShip.flatMap((r) => r.shipment.items).map((i) => ({ key: i.key, src: i.image, name: i.name }))}
                    rounded="rounded-md"
                  />
                }
              />
            )}
            {lowStock.length > 0 && (
              <AttentionRow
                to="/vendor/dashboard/inventory"
                tone="warning"
                icon={<AlertIcon className="h-4.5 w-4.5" />}
                count={lowStock.length}
                title={`Product${lowStock.length > 1 ? 's' : ''} low or out of stock`}
                text="Restock before they stop selling"
                meta={
                  <>
                    <ThumbStack
                      items={lowStock.map((p) => ({ key: p.id, src: p.images[0], name: p.name }))}
                      rounded="rounded-md"
                    />
                    {outCount > 0 && <MetaChip tone="danger">{outCount} out</MetaChip>}
                    {lowCount > 0 && <MetaChip tone="warning">{lowCount} low</MetaChip>}
                  </>
                }
              />
            )}
            {!openTasks && <AllClear text="No parcels to ship and everything is in stock." />}
          </div>

          <QuickActions
            actions={[
              { label: 'Add product', hint: 'New listing', to: '/vendor/dashboard/products/new', icon: LuPlus },
              { label: 'New discount', hint: 'Code or sale', to: '/vendor/dashboard/discounts', icon: LuTicketPercent },
              { label: 'Inventory', hint: 'Stock levels', to: '/vendor/dashboard/inventory', icon: LuBoxes },
              { label: 'Payouts', hint: formatPriceWhole(sales.pendingPayout) + ' pending', to: '/vendor/dashboard/payouts', icon: LuWallet },
            ]}
          />
        </Panel>
      </div>

      <div className="pt-2">
        <SectionHeader
          title="Recent orders"
          count={shipments.length}
          subtitle="Your latest parcels"
          action={<SectionButtonLink to="/vendor/dashboard/orders">All orders</SectionButtonLink>}
        />
        <DataTable
          rows={recent}
          columns={columns}
          keyOf={(r) => r.order.orderNumber}
          empty="No orders yet — they’ll appear here the moment a customer checks out."
          pageSize={6}
        />
      </div>
    </div>
  )
}
