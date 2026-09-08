import { useParams } from 'react-router-dom'
import { ButtonLink } from '@/shared/ui'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useUpdateShipmentStatus } from '@/features/inventory/lib/useUpdateShipmentStatus'
import { OrderDetailView } from '@/features/orders/components/OrderDetailView'

export function AdminOrderDetail() {
  const { id } = useParams()
  const { orders } = useOrders()
  const updateShipmentStatus = useUpdateShipmentStatus()
  const order = orders.find((o) => o.orderNumber === id)

  if (!order) {
    return (
      <div>
        <p className="text-sm text-ink-mute">Order not found.</p>
        <ButtonLink to="/admin/orders" variant="secondary" className="mt-4">
          Back to orders
        </ButtonLink>
      </div>
    )
  }

  return (
    <OrderDetailView
      order={order}
      backTo="/admin/orders"
      onStatusChange={(vendorId, status) => updateShipmentStatus(order.orderNumber, vendorId, status)}
    />
  )
}
