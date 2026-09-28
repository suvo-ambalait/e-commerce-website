import { useMemo, useState } from 'react'
import { LuCoins, LuPackage, LuPercent, LuReceipt, LuRotateCcw, LuShoppingBag } from 'react-icons/lu'
import { PageHeader, Panel, StatCard, StatGrid, FadeItem, DataTable, type Column } from '../components/primitives'
import { ExportButton, TableTabs, downloadCsv } from '../components/TableKit'
import { AreaChart, Avatar, BreakdownBars } from '@/shared/ui'
import { formatPrice, formatPriceWhole } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { returnsStore } from '@/features/marketplace/stores'
import { paymentLabel } from '@/features/checkout/components/checkoutForms'
import { useSettings } from '../context/SettingsContext'

type Range = '7' | '30' | '90' | '365'
const rangeLabel: Record<Range, string> = { '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days', '365': 'Last 12 months' }

interface ShopRow {
  vendorId: string
  orders: number
  units: number
  gross: number
  commission: number
  net: number
}

export function AdminReports() {
  const { orders } = useOrders()
  const { getVendor } = useVendors()
  const { settings } = useSettings()
  const [returns] = returnsStore.useStore()
  const [range, setRange] = useState<Range>('30')
  const rate = settings.commissionRate

  const report = useMemo(() => {
    const days = Number(range)
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setDate(since.getDate() - (days - 1))
    const inRange = orders.filter((o) => new Date(o.date) >= since)

    // revenue over time: daily buckets, monthly for the 12-month view
    const monthly = days > 90
    const buckets = new Map<string, number>()
    for (let i = monthly ? 11 : days - 1; i >= 0; i--) {
      const d = new Date()
      if (monthly) d.setMonth(d.getMonth() - i, 1)
      else d.setDate(d.getDate() - i)
      buckets.set(monthly ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10), 0)
    }
    for (const o of inRange) {
      const key = monthly ? o.date.slice(0, 7) : o.date.slice(0, 10)
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + o.grandTotal)
    }
    const series = [...buckets.entries()].map(([key, value]) => ({
      label: new Date(monthly ? `${key}-01` : key).toLocaleDateString('en-US', monthly ? { month: 'short' } : { month: 'short', day: 'numeric' }),
      value: Math.round(value),
    }))

    const shops = new Map<string, ShopRow>()
    const categories = new Map<string, number>()
    const products = new Map<string, { name: string; image: string; units: number; revenue: number }>()
    const payments = new Map<string, number>()
    let units = 0

    for (const o of inRange) {
      const method = o.payment ? paymentLabel[o.payment.method] : 'Card'
      payments.set(method, (payments.get(method) ?? 0) + 1)
      for (const s of o.shipments) {
        if (s.status === 'Cancelled') continue
        const gross = s.subtotal - s.discount
        const row = shops.get(s.vendorId) ?? { vendorId: s.vendorId, orders: 0, units: 0, gross: 0, commission: 0, net: 0 }
        const shipUnits = s.items.reduce((n, i) => n + i.quantity, 0)
        row.orders += 1
        row.units += shipUnits
        row.gross += gross
        row.commission += gross * rate
        row.net += gross * (1 - rate)
        shops.set(s.vendorId, row)
        units += shipUnits
        for (const i of s.items) {
          categories.set(i.category, (categories.get(i.category) ?? 0) + i.price * i.quantity)
          const p = products.get(i.productId) ?? { name: i.name, image: i.image, units: 0, revenue: 0 }
          p.units += i.quantity
          p.revenue += i.price * i.quantity
          products.set(i.productId, p)
        }
      }
    }

    const revenue = inRange.reduce((n, o) => n + o.grandTotal, 0)
    const shopRows = [...shops.values()]
    const refunds = returns
      .filter((r) => r.status === 'Refunded' && new Date(r.updatedAt) >= since)
      .reduce((n, r) => n + r.amount, 0)

    return {
      inRange,
      series,
      revenue,
      units,
      commission: shopRows.reduce((n, r) => n + r.commission, 0),
      refunds,
      shopRows,
      categories: [...categories.entries()].map(([label, value]) => ({ label, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 6),
      topProducts: [...products.entries()].map(([id, p]) => ({ id, ...p })).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
      payments: [...payments.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    }
  }, [orders, returns, range, rate])

  const shopColumns: Column<ShopRow>[] = [
    {
      header: 'Shop',
      id: 'shop',
      sortValue: (r) => getVendor(r.vendorId)?.name ?? '',
      cell: (r) => {
        const v = getVendor(r.vendorId)
        return (
          <span className="flex items-center gap-2.5">
            <Avatar src={v?.logo} name={v?.name ?? '?'} size={28} />
            <span className="max-w-44 truncate font-semibold text-ink">{v?.name ?? 'Unknown'}</span>
          </span>
        )
      },
    },
    { header: 'Orders', id: 'orders', align: 'right', sortValue: (r) => r.orders, cell: (r) => <span className="tabular-nums">{r.orders}</span> },
    { header: 'Units', id: 'units', align: 'right', hideBelow: 'md', sortValue: (r) => r.units, cell: (r) => <span className="tabular-nums">{r.units}</span> },
    { header: 'Sales', id: 'gross', align: 'right', sortValue: (r) => r.gross, cell: (r) => <span className="font-bold text-ink tabular-nums">{formatPrice(r.gross)}</span> },
    {
      header: 'Commission',
      id: 'commission',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (r) => r.commission,
      cell: (r) => <span className="text-accent tabular-nums">{formatPrice(r.commission)}</span>,
    },
    { header: 'Shop earns', id: 'net', align: 'right', hideBelow: 'lg', sortValue: (r) => r.net, cell: (r) => <span className="text-ink-soft tabular-nums">{formatPrice(r.net)}</span> },
  ]

  const exportAll = () =>
    downloadCsv(
      `report-${range}-days.csv`,
      ['shop', 'orders', 'units', 'sales', 'commission', 'shop_earns'],
      report.shopRows.map((r) => [getVendor(r.vendorId)?.name ?? r.vendorId, r.orders, r.units, r.gross.toFixed(2), r.commission.toFixed(2), r.net.toFixed(2)]),
    )

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description={`${rangeLabel[range]} · ${report.inRange.length} orders`} action={<ExportButton onClick={exportAll} />} />

      <TableTabs
        label="Date range"
        value={range}
        onChange={setRange}
        tabs={(Object.keys(rangeLabel) as Range[]).map((r) => ({ value: r, label: rangeLabel[r] }))}
      />

      <StatGrid>
        <FadeItem>
          <StatCard label="Revenue" value={formatPriceWhole(report.revenue)} icon={LuCoins} hint="incl. delivery and tax" />
        </FadeItem>
        <FadeItem>
          <StatCard label="Orders" value={String(report.inRange.length)} icon={LuReceipt} hint={`${report.units} units sold`} />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Average order"
            value={formatPriceWhole(report.inRange.length ? report.revenue / report.inRange.length : 0)}
            icon={LuShoppingBag}
            hint="per checkout"
          />
        </FadeItem>
        <FadeItem>
          <StatCard label="Commission earned" value={formatPriceWhole(report.commission)} icon={LuPercent} hint={`${Math.round(rate * 100)}% of shop sales`} />
        </FadeItem>
      </StatGrid>

      <Panel title="Revenue" subtitle={rangeLabel[range]}>
        <AreaChart data={report.series} height={240} valueFormat={(n) => formatPrice(n)} axisFormat={(n) => formatPriceWhole(n)} showLatest={false} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Sales by category">
          {report.categories.length ? (
            <BreakdownBars data={report.categories} valueFormat={(n) => formatPriceWhole(n)} />
          ) : (
            <p className="text-sm text-ink-mute">No sales in this period.</p>
          )}
        </Panel>
        <Panel title="Payment methods" subtitle="Share of orders">
          {report.payments.length ? <BreakdownBars data={report.payments} valueFormat={(n) => `${n} orders`} /> : <p className="text-sm text-ink-mute">No orders in this period.</p>}
        </Panel>
        <Panel title="Refunds" subtitle="Money returned to customers">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <LuRotateCcw className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-extrabold text-ink tabular-nums">{formatPriceWhole(report.refunds)}</p>
              <p className="text-caption text-ink-mute">
                {report.revenue ? `${((report.refunds / report.revenue) * 100).toFixed(1)}% of revenue` : 'No revenue yet'}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        <DataTable rows={report.shopRows} columns={shopColumns} keyOf={(r) => r.vendorId} empty="No shop sales in this period." defaultSort={{ id: 'gross', dir: 'desc' }} />

        <Panel title="Top products" subtitle="By sales">
          {report.topProducts.length === 0 ? (
            <p className="text-sm text-ink-mute">No sales in this period.</p>
          ) : (
            <ol className="space-y-3">
              {report.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="w-4 text-caption font-bold text-ink-mute">{i + 1}</span>
                  <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-mute">
                      <LuPackage className="h-3 w-3" />
                      {p.units} sold
                    </span>
                  </span>
                  <span className="text-sm font-bold text-ink tabular-nums">{formatPriceWhole(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  )
}
