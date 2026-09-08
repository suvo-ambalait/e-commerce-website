import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, DataTable, Toolbar, type Column } from '../components/primitives'
import { Badge, Input, Select } from '@/shared/ui'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useUpdateShipmentStatus } from '@/features/inventory/lib/useUpdateShipmentStatus'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Order, ShipmentStatus } from '@/shared/types'

const statuses: ShipmentStatus[] = ['Processing', 'Shipped', 'Delivered', 'Cancelled']

function overall(order: Order): ShipmentStatus {
  const set = new Set(order.shipments.map((s) => s.status))
  if (set.size === 1) return [...set][0]
  if (set.has('Processing')) return 'Processing'
  return 'Shipped'
}

export function AdminOrders() {
  const { orders } = useOrders()
  const updateShipmentStatus = useUpdateShipmentStatus()
  const { getVendor } = useVendors()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ShipmentStatus | ''>('')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (q && !o.orderNumber.toLowerCase().includes(q) && !o.email.toLowerCase().includes(q)) return false
      if (status && !o.shipments.some((s) => s.status === status)) return false
      return true
    })
  }, [orders, search, status])

  const columns: Column<Order>[] = [
    {
      header: 'Order',
      cell: (o) => (
        <Link to={`/admin/orders/${o.orderNumber}`} className="font-medium text-ink hover:text-accent hover:underline">
          {o.orderNumber}
        </Link>
      ),
    },
    { header: 'Date', cell: (o) => formatDate(o.date), hideBelow: 'sm' },
    { header: 'Customer', cell: (o) => o.email, hideBelow: 'md' },
    {
      header: 'Shipments',
      cell: (o) => (
        <div className="space-y-1">
          {o.shipments.map((s) => (
            <div key={s.vendorId} className="flex items-center gap-2">
              <span className="text-caption text-ink-mute">{getVendor(s.vendorId)?.name}</span>
              <Select
                size="sm"
                value={s.status}
                onChange={(v) => updateShipmentStatus(o.orderNumber, s.vendorId, v as ShipmentStatus)}
                options={statuses.map((st) => ({ value: st, label: st }))}
                className="w-32"
              />
            </div>
          ))}
        </div>
      ),
    },
    { header: 'Total', cell: (o) => formatPrice(o.grandTotal) },
    { header: 'State', cell: (o) => <Badge tone="neutral">{overall(o)}</Badge>, hideBelow: 'lg' },
    {
      header: '',
      className: 'text-right',
      cell: (o) => (
        <Link to={`/admin/orders/${o.orderNumber}`} className="text-caption text-accent hover:underline">
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" description={`${orders.length} placed`} />
      <Toolbar>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order # or email…" className="h-9 max-w-xs" />
        <Select
          size="sm"
          value={status}
          onChange={(v) => setStatus(v as ShipmentStatus | '')}
          options={[{ value: '', label: 'Any status' }, ...statuses.map((s) => ({ value: s, label: s }))]}
          className="w-40"
        />
      </Toolbar>
      <DataTable rows={rows} columns={columns} keyOf={(o) => o.orderNumber} empty="No orders yet." />
    </div>
  )
}
