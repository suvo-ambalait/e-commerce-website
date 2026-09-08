import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, DataTable, Toolbar, type Column } from '@/features/admin/components/primitives'
import { Select } from '@/shared/ui'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useUpdateShipmentStatus } from '@/features/inventory/lib/useUpdateShipmentStatus'
import { vendorShipments } from '@/features/orders/lib/analytics'
import type { Order, Shipment, ShipmentStatus } from '@/shared/types'

const statuses: ShipmentStatus[] = ['Processing', 'Shipped', 'Delivered', 'Cancelled']

export function VendorOrders() {
  const vendor = useCurrentVendor()
  const { orders } = useOrders()
  const updateShipmentStatus = useUpdateShipmentStatus()
  const [filter, setFilter] = useState<ShipmentStatus | ''>('')

  const rows = useMemo(() => {
    if (!vendor) return []
    return vendorShipments(orders, vendor.id).filter((r) => !filter || r.shipment.status === filter)
  }, [vendor, orders, filter])

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const columns: Column<{ order: Order; shipment: Shipment }>[] = [
    {
      header: 'Order',
      cell: (r) => (
        <Link
          to={`/vendor/dashboard/orders/${r.order.orderNumber}`}
          className="font-medium text-ink hover:text-accent hover:underline"
        >
          {r.order.orderNumber}
        </Link>
      ),
    },
    { header: 'Customer', cell: (r) => r.order.email, hideBelow: 'md' },
    { header: 'Date', cell: (r) => formatDate(r.order.date), hideBelow: 'sm' },
    {
      header: 'Items',
      cell: (r) => (
        <div className="flex -space-x-2">
          {r.shipment.items.slice(0, 3).map((i) => (
            <img key={i.key} src={i.image} alt="" className="h-8 w-8 rounded-sm border-2 border-surface object-cover" />
          ))}
        </div>
      ),
      hideBelow: 'sm',
    },
    { header: 'Value', cell: (r) => formatPrice(r.shipment.total) },
    {
      header: 'Status',
      cell: (r) => (
        <Select
          size="sm"
          value={r.shipment.status}
          onChange={(v) => updateShipmentStatus(r.order.orderNumber, vendor.id, v as ShipmentStatus)}
          options={statuses.map((s) => ({ value: s, label: s }))}
          className="w-36"
        />
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" description={`${rows.length} shipments to fulfil`} />
      <Toolbar>
        <Select
          size="sm"
          value={filter}
          onChange={(v) => setFilter(v as ShipmentStatus | '')}
          options={[{ value: '', label: 'All statuses' }, ...statuses.map((s) => ({ value: s, label: s }))]}
          className="w-44"
        />
      </Toolbar>
      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(r) => `${r.order.orderNumber}-${r.shipment.vendorId}`}
        empty="No orders yet."
      />
    </div>
  )
}
