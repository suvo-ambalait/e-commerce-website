import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LuBoxes,
  LuDownload,
  LuMapPin,
  LuPackageCheck,
  LuPlus,
  LuReceipt,
  LuStore,
  LuTicketPercent,
  LuUserPlus,
} from 'react-icons/lu'
import { PageHeader, Panel, StatCard, StatGrid, FadeItem, DataTable, type Column } from '../components/primitives'
import { Pill } from '../components/TableKit'
import { CoinIcon, PercentIcon, StorefrontIcon, AlertIcon } from '../components/icons'
import { AreaChart, Avatar, BarChart } from '@/shared/ui'
import { overallStatus, shipmentTone } from '@/features/orders/lib/status'
import {
  AllClear,
  AttentionRow,
  MetaChip,
  OpenCountPill,
  PanelLink,
  QuickActions,
  SectionButtonLink,
  SectionHeader,
  ThumbStack,
  timeAgo,
} from '../components/DashboardWidgets'
import { ChevronRightIcon } from '@/shared/ui/icons'
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
  const latestRev = revenue[revenue.length - 1].value
  const prevRev = revenue.length > 1 ? revenue[revenue.length - 2].value : 0
  const dayChange = prevRev ? (latestRev - prevRev) / prevRev : null

  const dayBars = ordersByDay(orders)
  const dayName: Record<string, string> = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }
  const dayMax = Math.max(0, ...dayBars.map((d) => d.value))
  const dayMin = Math.min(...dayBars.map((d) => d.value))
  const busiestDays = dayBars.filter((d) => d.value === dayMax)
  const quietestDays = dayBars.filter((d) => d.value === dayMin)
  const weekdayTotal = sum(dayBars)
  const joinDays = (ds: typeof dayBars, short = false) => {
    const names = ds.map((d) => (short ? d.label : dayName[d.label]))
    return names.length <= 2 ? names.join(' & ') : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
  }
  const busiestText =
    dayMax === 0
      ? 'No orders yet'
      : `${joinDays(busiestDays)} ${busiestDays.length > 1 ? 'are' : 'is'} busiest`

  const commission = orders.reduce(
    (s, o) => s + o.shipments.reduce((n, sh) => n + (sh.subtotal - sh.discount) * settings.commissionRate, 0),
    0,
  )
  const active = vendors.filter((v) => v.status === 'active')
  const pending = vendors.filter((v) => v.status === 'pending')
  const lowStock = products.filter((p) => statusFor(p) !== 'in')
  const outCount = lowStock.filter((p) => statusFor(p) === 'out').length
  const lowCount = lowStock.length - outCount
  const toFulfil = orders.filter((o) => overallStatus(o) === 'Processing').length
  const openTasks = [lowStock.length, pending.length, toFulfil].filter(Boolean).length
  const rangeLabel = `${formatShort(days - 1)} – ${formatShort(0)}`

  const soldItems = orders.flatMap((o) => o.shipments).flatMap((s) => s.items)
  const catAll = categories
    .map((c) => {
      const items = soldItems.filter((i) => i.category === c.name)
      return {
        label: c.name,
        image: c.image,
        value: items.reduce((n, i) => n + i.price * i.quantity, 0),
        units: items.reduce((n, i) => n + i.quantity, 0),
      }
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
  const catSales = catAll.slice(0, 5)
  const catTotal = catAll.reduce((n, c) => n + c.value, 0)
  const catUnits = catAll.reduce((n, c) => n + c.units, 0)
  const catMax = Math.max(1, ...catSales.map((c) => c.value))
  const catRest = catAll.length - catSales.length

  const vendorRows = active
    .map((v) => {
      const own = products.filter((p) => p.vendorId === v.id)
      return {
        vendor: v,
        pieces: own.length,
        lowStock: own.filter((p) => statusFor(p) !== 'in').length,
        sales: orders
          .flatMap((o) => o.shipments)
          .filter((s) => s.vendorId === v.id)
          .reduce((n, s) => n + s.subtotal - s.discount, 0),
      }
    })
    .sort((a, b) => b.pieces - a.pieces || b.sales - a.sales)
    .slice(0, 6)
  const catalogueTotal = products.length
  const topSales = Math.max(0, ...vendorRows.map((r) => r.sales))

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
      cell: (o) => {
        const items = o.shipments.reduce((n, s) => n + s.items.reduce((m, i) => m + i.quantity, 0), 0)
        return (
          <Link to={`/admin/orders/${o.orderNumber}`} className="group/order flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/15 transition-colors group-hover/order:bg-accent group-hover/order:text-on-accent">
              <LuReceipt className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink tabular-nums transition-colors group-hover/order:text-accent">
                {o.orderNumber}
              </span>
              <span className="block text-caption text-ink-mute">
                {items} item{items === 1 ? '' : 's'}
              </span>
            </span>
          </Link>
        )
      },
    },
    {
      header: 'Date',
      hideBelow: 'sm',
      cell: (o) => (
        <span>
          <span className="block text-ink">{formatDate(o.date)}</span>
          <span className="block text-caption text-ink-mute">{timeAgo(o.date)}</span>
        </span>
      ),
    },
    {
      header: 'Customer',
      hideBelow: 'md',
      cell: (o) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={o.shippingInfo.fullName || o.email} size={32} className="bg-accent-soft! text-accent!" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{o.shippingInfo.fullName || 'Guest'}</span>
            <span className="block truncate text-caption text-ink-mute">{o.email}</span>
          </span>
        </span>
      ),
    },
    {
      header: 'Sellers',
      hideBelow: 'lg',
      cell: (o) => {
        const sellers = o.shipments.map((s) => getVendor(s.vendorId)).filter((v) => v !== undefined)
        return (
          <span className="flex items-center gap-2.5">
            <span className="flex -space-x-2">
              {sellers.slice(0, 3).map((v) => (
                <Avatar key={v.id} src={v.logo} name={v.name} size={28} className="ring-2 ring-surface" />
              ))}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">
                {sellers.map((v) => v.name.split(' ')[0]).join(', ')}
              </span>
              <span className="block text-caption text-ink-mute">
                {sellers.length} parcel{sellers.length === 1 ? '' : 's'}
              </span>
            </span>
          </span>
        )
      },
    },
    {
      header: 'Status',
      hideBelow: 'sm',
      cell: (o) => (
        <Pill tone={shipmentTone[overallStatus(o)]} dot>
          {overallStatus(o)}
        </Pill>
      ),
    },
    {
      header: 'Total',
      align: 'right',
      cell: (o) => (
        <span className="inline-flex flex-col items-end">
          <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink tabular-nums">
            {formatPrice(o.grandTotal)}
          </span>
          {o.payment && (
            <span
              className={cn(
                'text-caption font-medium',
                o.payment.status === 'Paid' ? 'text-success' : 'text-ink-mute',
              )}
            >
              {o.payment.status}
            </span>
          )}
        </span>
      ),
    },
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
                {formatPrice(latestRev)}
              </p>
              <p className="mt-1.5 flex items-center justify-end gap-1.5 text-caption text-ink-mute">
                {dayChange !== null && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                      dayChange >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                    )}
                  >
                    {dayChange >= 0 ? '▲' : '▼'} {Math.abs(dayChange * 100).toFixed(0)}%
                  </span>
                )}
                {revenue[revenue.length - 1].label}
              </p>
            </div>
          }
        >
          <AreaChart
            data={revenue}
            height={260}
            valueFormat={(n) => formatPrice(n)}
            axisFormat={(n) => formatPriceWhole(n)}
            showLatest={false}
          />
        </Panel>
        <Panel title="Orders by weekday" subtitle={busiestText} className="flex flex-col">
          <BarChart
            data={dayBars}
            height={220}
            className="flex-1"
            valueFormat={(n) => `${n} order${n === 1 ? '' : 's'}`}
          />
          <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl bg-surface-sunken/60 py-3 text-center">
            {[
              { label: 'Total', value: String(weekdayTotal) },
              { label: 'Busiest', value: dayMax ? joinDays(busiestDays, true) : '—' },
              { label: 'Quietest', value: dayMax ? joinDays(quietestDays, true) : '—' },
            ].map((s) => (
              <div key={s.label} className="min-w-0 px-2">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-mute">{s.label}</dt>
                <dd className="mt-1 truncate font-display text-sm font-bold text-ink tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="Sales by category"
          subtitle="All-time item sales"
          className="flex flex-col"
          aside={<PanelLink to="/admin/categories">View all</PanelLink>}
        >
          {catSales.length === 0 ? (
            <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border py-10 text-caption text-ink-mute">
              No sales yet
            </p>
          ) : (
            <>
              {/* headline */}
              <div className="flex items-end justify-between gap-3 rounded-xl bg-surface-sunken/60 px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Total</p>
                  <p className="mt-1 font-display text-2xl font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                    {formatPrice(catTotal)}
                  </p>
                </div>
                <p className="text-right text-caption text-ink-mute">
                  <span className="font-semibold text-ink tabular-nums">{catUnits}</span> units
                  <br />
                  <span className="font-semibold text-ink tabular-nums">{catAll.length}</span> categories
                </p>
              </div>

              {/* rows */}
              <ul className="mt-4 flex flex-1 flex-col justify-around gap-3">
                {catSales.map((c, i) => {
                  const share = catTotal ? c.value / catTotal : 0
                  const top = i === 0
                  return (
                    <li key={c.label} className="group flex items-center gap-3">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-border"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-caption font-bold text-accent">
                          {c.label[0]}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-ink">{c.label}</span>
                            {top && (
                              <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">
                                Top
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-sm font-bold text-ink tabular-nums">{formatPrice(c.value)}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                            <div
                              className={cn(
                                'h-full rounded-full transition-[width,background-color] duration-500',
                                top ? 'bg-accent' : 'bg-accent/45 group-hover:bg-accent/70',
                              )}
                              style={{ width: `${Math.max(3, (c.value / catMax) * 100)}%` }}
                            />
                          </div>
                          <span className="w-9 shrink-0 text-right text-caption font-semibold text-ink-mute tabular-nums">
                            {Math.round(share * 100)}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-mute tabular-nums">
                          {c.units} unit{c.units === 1 ? '' : 's'} sold
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* footer insight */}
              <p className="mt-5 flex items-center gap-2 border-t border-border pt-3 text-caption text-ink-mute">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  <span className="font-semibold text-ink">{catSales[0].label}</span> brings in{' '}
                  {Math.round((catSales[0].value / (catTotal || 1)) * 100)}% of sales
                  {catRest > 0 && ` · ${catRest} more categor${catRest === 1 ? 'y' : 'ies'} in View all`}
                </span>
              </p>
            </>
          )}
        </Panel>

        <Panel
          title="Catalogue by vendor"
          subtitle={`${catalogueTotal} products across ${active.length} active shops`}
          aside={<PanelLink to="/admin/vendors">Vendors</PanelLink>}
        >
          <ul className="@container -mx-2 space-y-0.5">
            {vendorRows.map(({ vendor, pieces, lowStock, sales }) => {
              const share = catalogueTotal ? pieces / catalogueTotal : 0
              const isTop = sales > 0 && sales === topSales
              return (
                <li key={vendor.id}>
                  <Link
                    to={`/admin/vendors/${vendor.id}`}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-sunken/70"
                  >
                    <span className="relative shrink-0">
                      <Avatar src={vendor.logo} name={vendor.name} size={36} className="ring-1 ring-border" />
                      {lowStock > 0 && (
                        <span
                          title={`${lowStock} low or out of stock`}
                          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-surface"
                        />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-accent">
                          {vendor.name}
                        </span>
                        {isTop && (
                          <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">
                            Top seller
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-caption text-ink-mute">
                        <LuMapPin className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="truncate">{vendor.location.split(',')[0]}</span>
                        <span aria-hidden>·</span>
                        <span className="shrink-0 tabular-nums">{formatPriceWhole(sales)} sold</span>
                      </span>
                      {/* share of the whole catalogue */}
                      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-sunken">
                        <span
                          className="block h-full rounded-full bg-accent/70 transition-[width] duration-500 group-hover:bg-accent"
                          style={{ width: `${Math.max(4, share * 100)}%` }}
                        />
                      </span>
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="block font-display text-base font-bold leading-none text-ink tabular-nums">
                        {pieces}
                      </span>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                        {Math.round(share * 100)}% of all
                      </span>
                    </span>

                    <ChevronRightIcon className="hidden h-4 w-4 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:text-accent @[20rem]:block" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel
          title="Needs attention"
          subtitle={openTasks ? 'Things waiting on you today' : 'You’re all caught up'}
          className="flex flex-col lg:col-span-2 xl:col-span-1"
          aside={<OpenCountPill open={openTasks} />}
        >
          <div className="space-y-2.5">
            {lowStock.length > 0 && (
              <AttentionRow
                to="/admin/inventory"
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
            {toFulfil > 0 && (
              <AttentionRow
                to="/admin/orders"
                tone="info"
                icon={<LuPackageCheck className="h-4.5 w-4.5" />}
                count={toFulfil}
                title={`Order${toFulfil > 1 ? 's' : ''} to fulfil`}
                text="Still processing with a shop"
              />
            )}
            {pending.length > 0 && (
              <AttentionRow
                to="/admin/vendors"
                tone="accent"
                icon={<LuStore className="h-4.5 w-4.5" />}
                count={pending.length}
                title={`Vendor application${pending.length > 1 ? 's' : ''} pending`}
                text="Review before they go live"
                meta={
                  <ThumbStack
                    items={pending.map((v) => ({ key: v.id, src: v.logo, name: v.name }))}
                    rounded="rounded-full"
                  />
                }
              />
            )}
            {!openTasks && <AllClear />}
          </div>

          <QuickActions
            actions={[
              { label: 'Add product', hint: 'New listing', to: '/admin/products/new', icon: LuPlus },
              { label: 'New discount', hint: 'Code or sale', to: '/admin/discounts', icon: LuTicketPercent },
              { label: 'Invite vendor', hint: 'Grow the shops', to: '/admin/vendors', icon: LuUserPlus },
              { label: 'Inventory', hint: 'Stock levels', to: '/admin/inventory', icon: LuBoxes },
            ]}
          />
        </Panel>
      </div>

      <div className="pt-2">
        <SectionHeader
          title="Recent orders"
          count={orders.length}
          subtitle="Latest checkouts across all shops"
          action={<SectionButtonLink to="/admin/orders">All orders</SectionButtonLink>}
        />
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
