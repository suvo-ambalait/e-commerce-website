import { StockPill } from '@/features/admin/components/TableKit'
import type { StockStatus } from '../lib/status'

/** Stock state as a coloured pill — pass `stock` to show the unit count. */
export function StockStatusBadge({ status, stock }: { status: StockStatus; stock?: number }) {
  return <StockPill status={status} stock={stock} />
}
