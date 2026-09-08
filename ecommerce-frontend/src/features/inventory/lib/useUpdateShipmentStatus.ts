import { useCallback } from 'react'
import type { ShipmentStatus } from '@/shared/types'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useInventory } from '../context/InventoryContext'

/**
 * Wraps `useOrders().updateShipmentStatus` and keeps stock in sync:
 * moving a shipment into `Cancelled` returns its units to stock; moving it back
 * out of `Cancelled` takes them out again.
 */
export function useUpdateShipmentStatus() {
  const { orders, updateShipmentStatus } = useOrders()
  const { reverseShipment, reapplyShipment } = useInventory()

  return useCallback(
    (orderNumber: string, vendorId: string, status: ShipmentStatus) => {
      const prev = orders
        .find((o) => o.orderNumber === orderNumber)
        ?.shipments.find((s) => s.vendorId === vendorId)?.status

      updateShipmentStatus(orderNumber, vendorId, status)

      if (prev && prev !== 'Cancelled' && status === 'Cancelled') {
        reverseShipment(orderNumber, vendorId)
      } else if (prev === 'Cancelled' && status !== 'Cancelled') {
        reapplyShipment(orderNumber, vendorId)
      }
    },
    [orders, updateShipmentStatus, reverseShipment, reapplyShipment],
  )
}
