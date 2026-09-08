import { Badge } from '@/shared/ui'
import { statusLabel, statusTone, type StockStatus } from '../lib/status'

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
}
