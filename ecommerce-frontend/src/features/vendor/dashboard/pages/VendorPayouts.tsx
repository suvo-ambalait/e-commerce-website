import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LuCoins, LuPercent, LuWallet } from 'react-icons/lu'
import { PageHeader, StatCard, StatGrid, FadeItem, DataTable, type Column } from '@/features/admin/components/primitives'
import { ExportButton, Pill, TableSearch, TableTabs, TableToolbar, downloadCsv } from '@/features/admin/components/TableKit'
import { formatPrice, formatPriceWhole, formatDate } from '@/shared/lib/format'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { summariseVendorSales, vendorShipments } from '@/features/orders/lib/analytics'
import type { Order, Shipment } from '@/shared/types'
import { payoutRequestsStore } from '@/features/marketplace/stores'
import { vendorBalance } from '@/features/marketplace/payouts'
import { PayoutPanels } from '../components/PayoutPanels'

type Row = { order: Order; shipment: Shipment }
type Tab = 'all' | 'released' | 'pending' | 'void'

const state = (r: Row): Exclude<Tab, 'all'> =>
  r.shipment.status === 'Delivered' ? 'released' : r.shipment.status === 'Cancelled' ? 'void' : 'pending'

export function VendorPayouts() {
  const vendor = useCurrentVendor()
  const { orders } = useOrders()
  const { settings } = useSettings()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [payoutRequests] = payoutRequestsStore.useStore()

  const all = useMemo(() => (vendor ? vendorShipments(orders, vendor.id) : []), [vendor, orders])
  const rows = all.filter(
    (r) => (tab === 'all' || state(r) === tab) && (!search.trim() || r.order.orderNumber.toLowerCase().includes(search.trim().toLowerCase())),
  )

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const rate = settings.commissionRate
  const sales = summariseVendorSales(orders, vendor.id, rate)
  const balance = vendorBalance(orders, vendor.id, rate, payoutRequests)
  const gross = (r: Row) => r.shipment.subtotal - r.shipment.discount
  const n = (t: Exclude<Tab, 'all'>) => all.filter((r) => state(r) === t).length

  const columns: Column<Row>[] = [
    {
      header: 'Order',
      id: 'order',
      sortValue: (r) => r.order.orderNumber,
      cell: (r) => (
        <Link to={`/vendor/dashboard/orders/${r.order.orderNumber}`} className="font-display font-bold text-ink hover:text-accent">
          {r.order.orderNumber}
        </Link>
      ),
    },
    {
      header: 'Date',
      id: 'date',
      hideBelow: 'sm',
      sortValue: (r) => r.order.date,
      cell: (r) => <span className="whitespace-nowrap text-ink-mute">{formatDate(r.order.date)}</span>,
    },
    { header: 'Gross', id: 'gross', align: 'right', sortValue: gross, cell: (r) => <span className="tabular-nums">{formatPrice(gross(r))}</span> },
    {
      header: 'Commission',
      id: 'commission',
      align: 'right',
      hideBelow: 'md',
      cell: (r) => <span className="text-ink-mute tabular-nums">−{formatPrice(gross(r) * rate)}</span>,
    },
    {
      header: 'You receive',
      id: 'net',
      align: 'right',
      sortValue: (r) => gross(r) * (1 - rate),
      cell: (r) => <span className="font-bold text-ink tabular-nums">{formatPrice(gross(r) * (1 - rate))}</span>,
    },
    {
      header: 'Payout',
      id: 'payout',
      sortValue: (r) => state(r),
      cell: (r) =>
        state(r) === 'released' ? (
          <Pill tone="success" dot>
            Released
          </Pill>
        ) : state(r) === 'void' ? (
          <Pill tone="muted" dot>
            Cancelled
          </Pill>
        ) : (
          <Pill tone="warning" dot>
            On delivery
          </Pill>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payouts"
        description={`AmbalaEshop takes a flat ${Math.round(rate * 100)}% commission. Funds release once a parcel is marked delivered.`}
        action={
          <ExportButton
            onClick={() =>
              downloadCsv(
                'payouts.csv',
                ['order', 'date', 'gross', 'commission', 'net', 'payout'],
                rows.map((r) => [r.order.orderNumber, r.order.date.slice(0, 10), gross(r).toFixed(2), (gross(r) * rate).toFixed(2), (gross(r) * (1 - rate)).toFixed(2), state(r)]),
              )
            }
          />
        }
      />

      <StatGrid>
        <FadeItem>
          <StatCard label="Lifetime gross" value={formatPriceWhole(sales.gross)} icon={LuCoins} hint={`${sales.orders} orders`} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Commission" value={formatPriceWhole(sales.commission)} icon={LuPercent} hint={`${Math.round(rate * 100)}% flat`} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Net earnings" value={formatPriceWhole(sales.net)} icon={LuWallet} hint="after commission" />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Available to withdraw"
            value={formatPriceWhole(balance.available)}
            icon={LuWallet}
            hint={balance.pending > 0 ? `${formatPriceWhole(balance.pending)} on its way to you` : 'released funds'}
          />
        </FadeItem>
      </StatGrid>

      <PayoutPanels vendorId={vendor.id} balance={balance} />

      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(r) => r.order.orderNumber}
        empty="No sales yet."
        toolbar={
          <TableToolbar>
            <TableSearch value={search} onChange={setSearch} placeholder="Order #" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: all.length },
                { value: 'released', label: 'Released', count: n('released') },
                { value: 'pending', label: 'On delivery', count: n('pending') },
                { value: 'void', label: 'Cancelled', count: n('void') },
              ]}
            />
          </TableToolbar>
        }
        defaultSort={{ id: 'date', dir: 'desc' }}
      />
    </div>
  )
}
