import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuBan, LuCircleCheck, LuEye, LuMail, LuTruck } from 'react-icons/lu'
import { PageHeader, DataTable, BulkButton, type Column } from '@/features/admin/components/primitives'
import {
  DensityToggle,
  ExportButton,
  Pill,
  TableSearch,
  TableTabs,
  TableToolbar,
  downloadCsv,
  useTablePrefs,
} from '@/features/admin/components/TableKit'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useUpdateShipmentStatus } from '@/features/inventory/lib/useUpdateShipmentStatus'
import { vendorShipments } from '@/features/orders/lib/analytics'
import { shipmentTone } from '@/features/orders/lib/status'
import type { Order, Shipment, ShipmentStatus } from '@/shared/types'

type Row = { order: Order; shipment: Shipment }
type Tab = 'all' | ShipmentStatus

export function VendorOrders() {
  const vendor = useCurrentVendor()
  const navigate = useNavigate()
  const { orders } = useOrders()
  const updateShipmentStatus = useUpdateShipmentStatus()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [prefs, setPrefs] = useTablePrefs('vendor-orders')

  const all = useMemo(() => (vendor ? vendorShipments(orders, vendor.id) : []), [vendor, orders])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter((r) => {
      if (tab !== 'all' && r.shipment.status !== tab) return false
      if (q && !`${r.order.orderNumber} ${r.order.email} ${r.order.shippingInfo.fullName}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [all, search, tab])

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const keyOf = (r: Row) => r.order.orderNumber
  const count = (st: ShipmentStatus) => all.filter((r) => r.shipment.status === st).length
  const setStatus = (numbers: string[], status: ShipmentStatus) => {
    numbers.forEach((n) => updateShipmentStatus(n, vendor.id, status))
    notify(`${numbers.length} parcel${numbers.length > 1 ? 's' : ''} marked ${status.toLowerCase()}`, 'success')
  }

  const columns: Column<Row>[] = [
    {
      header: 'Order',
      id: 'order',
      sortValue: (r) => r.order.orderNumber,
      cell: (r) => (
        <Link to={`/vendor/dashboard/orders/${r.order.orderNumber}`} className="group block">
          <span className="block font-display font-bold text-ink group-hover:text-accent">{r.order.orderNumber}</span>
          <span className="block text-[11px] text-ink-mute">{r.shipment.items.reduce((n, i) => n + i.quantity, 0)} items</span>
        </Link>
      ),
    },
    {
      header: 'Customer',
      id: 'customer',
      hideBelow: 'lg',
      sortValue: (r) => r.order.shippingInfo.fullName,
      cell: (r) => (
        <span className="min-w-0">
          <span className="block max-w-40 truncate font-semibold text-ink">{r.order.shippingInfo.fullName || '—'}</span>
          <span className="block max-w-40 truncate text-[11px] text-ink-mute">
            {[r.order.shippingInfo.city, r.order.shippingInfo.country].filter(Boolean).join(', ')}
          </span>
        </span>
      ),
    },
    {
      header: 'Date',
      id: 'date',
      hideBelow: 'md',
      sortValue: (r) => r.order.date,
      cell: (r) => <span className="whitespace-nowrap text-ink-mute">{formatDate(r.order.date)}</span>,
    },
    {
      header: 'Items',
      id: 'items',
      hideBelow: 'sm',
      cell: (r) => (
        <div className="flex -space-x-2">
          {r.shipment.items.slice(0, 3).map((i) => (
            <img key={i.key} src={i.image} alt="" title={i.name} className="h-8 w-8 rounded-lg object-cover ring-2 ring-surface" />
          ))}
          {r.shipment.items.length > 3 && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-[10px] font-semibold text-accent ring-2 ring-surface">
              +{r.shipment.items.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Value',
      id: 'value',
      align: 'right',
      sortValue: (r) => r.shipment.total,
      cell: (r) => <span className="font-bold text-ink tabular-nums">{formatPrice(r.shipment.total)}</span>,
    },
    {
      header: 'Status',
      id: 'status',
      sortValue: (r) => r.shipment.status,
      cell: (r) => (
        <Pill tone={shipmentTone[r.shipment.status]} dot>
          {r.shipment.status}
        </Pill>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        description={`${all.length} parcels · ${count('Processing')} to fulfil`}
        action={
          <ExportButton
            onClick={() =>
              downloadCsv(
                'my-orders.csv',
                ['order', 'date', 'customer', 'items', 'value', 'status'],
                rows.map((r) => [
                  r.order.orderNumber,
                  r.order.date.slice(0, 10),
                  r.order.shippingInfo.fullName,
                  r.shipment.items.reduce((n, i) => n + i.quantity, 0),
                  r.shipment.total.toFixed(2),
                  r.shipment.status,
                ]),
              )
            }
          />
        }
      />
      <DataTable
        rows={rows}
        columns={columns}
        keyOf={keyOf}
        empty="No orders match."
        toolbar={
          <TableToolbar end={<DensityToggle value={prefs.density} onChange={(density) => setPrefs((p) => ({ ...p, density }))} />}>
            <TableSearch value={search} onChange={setSearch} placeholder="Order # or customer" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: all.length },
                { value: 'Processing', label: 'To fulfil', count: count('Processing') },
                { value: 'Shipped', label: 'Shipped', count: count('Shipped') },
                { value: 'Delivered', label: 'Delivered', count: count('Delivered') },
                { value: 'Cancelled', label: 'Cancelled', count: count('Cancelled') },
              ]}
            />
          </TableToolbar>
        }
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        density={prefs.density}
        defaultSort={{ id: 'date', dir: 'desc' }}
        rowActions={[
          { label: 'View order', icon: LuEye, onClick: (r) => navigate(`/vendor/dashboard/orders/${r.order.orderNumber}`) },
          { label: 'Email customer', icon: LuMail, onClick: (r) => window.open(`mailto:${r.order.email}?subject=Order ${r.order.orderNumber}`) },
          { label: 'Mark shipped', icon: LuTruck, onClick: (r) => setStatus([keyOf(r)], 'Shipped'), hidden: (r) => r.shipment.status !== 'Processing' },
          {
            label: 'Mark delivered',
            icon: LuCircleCheck,
            onClick: (r) => setStatus([keyOf(r)], 'Delivered'),
            hidden: (r) => ['Delivered', 'Cancelled'].includes(r.shipment.status),
          },
          {
            label: 'Cancel parcel',
            icon: LuBan,
            danger: true,
            onClick: (r) => {
              if (confirm(`Cancel your parcel for ${r.order.orderNumber}? Units go back into stock.`)) setStatus([keyOf(r)], 'Cancelled')
            },
            hidden: (r) => r.shipment.status === 'Cancelled',
          },
        ]}
        bulkBar={(keys, clear) => (
          <>
            <BulkButton icon={LuTruck} onClick={() => { setStatus(keys, 'Shipped'); clear() }}>
              Mark shipped
            </BulkButton>
            <BulkButton icon={LuCircleCheck} onClick={() => { setStatus(keys, 'Delivered'); clear() }}>
              Mark delivered
            </BulkButton>
          </>
        )}
      />
    </div>
  )
}
