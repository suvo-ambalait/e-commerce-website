import { Badge } from '@/shared/ui'
import type { ShipmentStatus } from '@/shared/types'

const tone: Record<ShipmentStatus, Parameters<typeof Badge>[0]['tone']> = {
  Processing: 'warning',
  Shipped: 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
}

export function OrderStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge tone={tone[status]}>{status}</Badge>
}
