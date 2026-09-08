import { useParams } from 'react-router-dom'
import { ButtonLink } from '@/shared/ui'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useUpdateShipmentStatus } from '@/features/inventory/lib/useUpdateShipmentStatus'
import { OrderDetailView } from '@/features/orders/components/OrderDetailView'
import { useCurrentVendor } from '../../lib/useCurrentVendor'

export function VendorOrderDetail() {
  const { id } = useParams()
  const vendor = useCurrentVendor()
  const { orders } = useOrders()
  const updateShipmentStatus = useUpdateShipmentStatus()
  const order = orders.find((o) => o.orderNumber === id)

  if (!vendor || !order || !order.shipments.some((s) => s.vendorId === vendor.id)) {
    return (
      <div>
        <p className="text-sm text-ink-mute">Order not found.</p>
        <ButtonLink to="/vendor/dashboard/orders" variant="secondary" className="mt-4">
          Back to orders
        </ButtonLink>
      </div>
    )
  }

  return (
    <OrderDetailView
      order={order}
      scopeVendorId={vendor.id}
      backTo="/vendor/dashboard/orders"
      onStatusChange={(vendorId, status) => updateShipmentStatus(order.orderNumber, vendorId, status)}
    />
  )
}
