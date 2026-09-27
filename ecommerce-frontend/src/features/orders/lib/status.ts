import type { PillTone } from '@/features/admin/components/TableKit'
import type { Order, ShipmentStatus } from '@/shared/types'

export const shipmentStatuses: ShipmentStatus[] = ['Processing', 'Shipped', 'Delivered', 'Cancelled']

export const shipmentTone: Record<ShipmentStatus, PillTone> = {
  Processing: 'warning',
  Shipped: 'accent',
  Delivered: 'success',
  Cancelled: 'muted',
}

/** One status for a multi-maker order: shared status, else Processing if any parcel is, else Shipped. */
export function overallStatus(order: Order): ShipmentStatus {
  const set = new Set(order.shipments.map((s) => s.status))
  if (set.size === 1) return [...set][0]
  if (set.has('Processing')) return 'Processing'
  return 'Shipped'
}
