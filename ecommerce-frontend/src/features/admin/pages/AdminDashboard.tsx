import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LuDownload, LuPlus, LuStore } from 'react-icons/lu'
import { PageHeader, Panel, StatCard, StatGrid, FadeItem, DataTable, type Column } from '../components/primitives'
import { CoinIcon, PercentIcon, StorefrontIcon, AlertIcon } from '../components/icons'
import { AreaChart, Avatar, Badge, BarChart } from '@/shared/ui'
import { ArrowRightIcon, CheckIcon, ChevronRightIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatPrice, formatPriceWhole } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useSettings } from '../context/SettingsContext'
import { ordersByDay, revenueSeries } from '@/features/orders/lib/analytics'
import type { Order } from '@/shared/types'

const ranges = [7, 14, 30] as const
type Range = (typeof ranges)[number]

const sum = (xs: { value: number }[]) => xs.reduce((n, x) => n + x.value, 0)

export function AdminDashboard() {
  const { orders } = useOrders()
  const { products, categories } = useCatalog()
  const { statusFor } = useInventory()
  const { vendors, getVendor } = useVendors()
  const { settings } = useSettings()
  const [days, setDays] = useState<Range>(14)

  const revenue = revenueSeries(orders, days)
  const prior = revenueSeries(orders, days * 2).slice(0, days)
  const gmv = sum(revenue)
  const priorGmv = sum(prior)
  const change = priorGmv ? (gmv - priorGmv) / priorGmv : 0

  const dayBars = ordersByDay(orders)
  const busiest = dayBars.reduce((a, b) => (b.value > a.value ? b : a), dayBars[0])
  const busiestName = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }[
    busiest.label
  ]

  const commission = orders.reduce(
    (s, o) => s + o.shipments.reduce((n, sh) => n + (sh.subtotal - sh.discount) * settings.commissionRate, 0),
    0,
  )
  const active = vendors.filter((v) => v.status === 'active')
  const pending = vendors.filter((v) => v.status === 'pending')
  const lowStock = products.filter((p) => statusFor(p) !== 'in')
  const rangeLabel = `${formatShort(days - 1)} – ${formatShort(0)}`

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
    .slice(0, 4)
  const catMax = Math.max(1, ...catSales.map((c) => c.value))

  const vendorRows = active
    .map((v) => ({ vendor: v, pieces: products.filter((p) => p.vendorId === v.id).length }))
    .sort((a, b) => b.pieces - a.pieces)
    .slice(0, 6)

  const exportCsv = () => {
    const csv = ['date,revenue', ...revenue.map((r) => `${r.label},${r.value}`)].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-last-${days}-days.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<Order>[] = [
    {
      header: 'Order',
      cell: (o) => (
        <Link to={`/admin/orders/${o.orderNumber}`} className="font-semibold text-ink hover:text-accent">
          {o.orderNumber}
        </Link>
      ),
    },
    { header: 'Date', cell: (o) => formatDate(o.date), hideBelow: 'sm' },
    { header: 'Customer', cell: (o) => o.email, hideBelow: 'md' },
    {
      header: 'Makers',
      cell: (o) => (
        <div className="flex flex-wrap gap-1">
          {o.shipments.map((s) => (
            <Badge key={s.vendorId} tone="accent">
              {getVendor(s.vendorId)?.name.split(' ')[0]}
            </Badge>
          ))}
        </div>
      ),
      hideBelow: 'md',
    },
    { header: 'Total', cell: (o) => <span className="font-semibold text-ink">{formatPrice(o.grandTotal)}</span> },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Overview"
        description={`Marketplace health at a glance · ${rangeLabel}`}
        action={
          <>
            <div className="flex rounded-xl border border-border bg-surface p-1" role="group" aria-label="Date range">
              {ranges.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={days === r}
                  onClick={() => setDays(r)}
                  className={cn(
                    'h-8 rounded-lg px-3 text-caption font-semibold transition-colors',
                    days === r ? 'bg-accent-soft text-accent' : 'text-ink-mute hover:text-ink',
                  )}
                >
                  {r}D
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50!"
            >
              <LuDownload className="h-4 w-4" />
              Export
            </button>
            <Link
              to="/admin/products/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              <LuPlus className="h-4 w-4" />
              Add product
            </Link>
          </>
        }
      />

      <StatGrid>
        <FadeItem>
          <StatCard
            label={`GMV · ${days} days`}
            value={formatPriceWhole(gmv)}
            spark={revenue.map((r) => r.value)}
            delta={{ value: `${Math.abs(change * 100).toFixed(1)}%`, positive: change >= 0 }}
            hint="vs prior period"
            icon={CoinIcon}
          />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Commission"
            value={formatPriceWhole(commission)}
            hint={`${Math.round(settings.commissionRate * 100)}% take rate`}
            icon={PercentIcon}
          />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Active vendors"
            value={String(active.length)}
            hint={`${pending.length} pending review`}
            icon={StorefrontIcon}
            aside={
              <div className="mb-1 flex -space-x-2">
                {active.slice(0, 3).map((v) => (
                  <Avatar key={v.id} src={v.logo} name={v.name} size={26} className="ring-2 ring-surface" />
                ))}
                {active.length > 3 && (
                  <span className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent ring-2 ring-surface">
                    +{active.length - 3}
                  </span>
                )}
              </div>
            }
          />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Low / out of stock"
            value={String(lowStock.length)}
            hint={lowStock.length ? 'Warning · needs restock' : 'All stocked'}
            icon={AlertIcon}
            tone={lowStock.length ? 'warning' : 'default'}
            aside={
              lowStock.length > 0 && (
                <Link
                  to="/admin/inventory"
                  className="mb-0.5 inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-caption font-semibold text-ink shadow-sm transition-colors hover:border-accent/50!"
                >
                  Review
                </Link>
              )
            }
          />
        </FadeItem>
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.75fr_1fr]">
        <Panel
          title="Revenue"
          subtitle={`Daily gross merchandise value, last ${days} days`}
          aside={
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {formatPrice(revenue[revenue.length - 1].value)}
              </p>
              <p className="mt-1 text-caption text-ink-mute">{revenue[revenue.length - 1].label}</p>
            </div>
          }
        >
          <AreaChart
            data={revenue}
            height={220}
            valueFormat={(n) => formatPrice(n)}
            axisFormat={(n) => formatPriceWhole(n)}
            showLatest={false}
          />
        </Panel>
        <Panel title="Orders by weekday" subtitle={`${busiestName} is busiest · hover a bar`}>
          <BarChart data={dayBars} height={240} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Sales by category" aside={<PanelLink to="/admin/categories">View all</PanelLink>}>
          <div className="space-y-4">
            {catSales.map((c) => (
              <div key={c.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-ink-soft">{c.label}</span>
                  <span className="font-bold text-ink tabular-nums">{formatPrice(c.value)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(c.value / catMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Catalogue by vendor" aside={<PanelLink to="/admin/vendors">Vendors</PanelLink>}>
          <ul className="@container space-y-2.5">
            {vendorRows.map(({ vendor, pieces }) => (
              <li key={vendor.id} className="flex items-center gap-2.5">
                <Avatar src={vendor.logo} name={vendor.name} size={26} />
                <Link
                  to={`/admin/vendors/${vendor.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-ink hover:text-accent"
                >
                  {vendor.name}
                </Link>
                <span className="hidden text-caption text-ink-mute @[19rem]:inline">{vendor.location.split(',')[0]}</span>
                <span className="rounded-md border border-border bg-surface-sunken/60 px-2 py-0.5 text-[11px] font-semibold text-ink-soft tabular-nums">
                  {pieces} pieces
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Needs attention" className="lg:col-span-2 xl:col-span-1">
          <div className="space-y-2">
            {lowStock.length > 0 && (
              <AttentionRow
                to="/admin/inventory"
                tone="warning"
                icon={<AlertIcon className="h-4 w-4" />}
                title={`${lowStock.length} product${lowStock.length > 1 ? 's' : ''} low or out of stock`}
                text="Warning · review inventory"
              />
            )}
            {pending.length > 0 && (
              <AttentionRow
                to="/admin/vendors"
                tone="accent"
                icon={<LuStore className="h-4 w-4" />}
                title={`${pending.length} vendor application${pending.length > 1 ? 's' : ''} pending`}
                text="Review before they go live"
              />
            )}
            {lowStock.length === 0 && pending.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success">
                <CheckIcon className="h-4 w-4" />
                All clear — nothing needs you right now.
              </div>
            )}
          </div>

          <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Add product', to: '/admin/products/new' },
              { label: 'New discount', to: '/admin/discounts' },
              { label: 'Invite vendor', to: '/admin/vendors' },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-caption font-semibold text-ink transition-colors hover:border-accent/50! hover:text-accent"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="pt-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display! text-base font-bold! tracking-[-0.01em]! text-ink">Recent orders</h3>
          <PanelLink to="/admin/orders">All orders</PanelLink>
        </div>
        <DataTable rows={orders} columns={columns} keyOf={(o) => o.orderNumber} empty="No orders yet." pageSize={6} />
      </div>
    </div>
  )
}

function formatShort(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function PanelLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-caption font-semibold text-accent hover:underline">
      {children}
      <ArrowRightIcon className="h-3 w-3" />
    </Link>
  )
}

function AttentionRow({
  to,
  tone,
  icon,
  title,
  text,
}: {
  to: string
  tone: 'warning' | 'accent'
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3 transition-colors',
        tone === 'warning'
          ? 'border-warning/30! bg-warning-soft/60 hover:border-warning/60!'
          : 'border-accent/20! bg-accent-soft/60 hover:border-accent/50!',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          tone === 'warning' ? 'bg-warning/15 text-warning' : 'bg-accent/15 text-accent',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-caption text-ink-mute">{text}</span>
      </span>
      <ChevronRightIcon className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
