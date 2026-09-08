import type { Badge } from '@/shared/ui'
import type { StockMovementReason } from '@/shared/types'

export type StockStatus = 'in' | 'low' | 'out'

export function stockStatus(onHand: number, reorderPoint: number): StockStatus {
  if (onHand <= 0) return 'out'
  if (onHand <= reorderPoint) return 'low'
  return 'in'
}

export const statusLabel: Record<StockStatus, string> = {
  in: 'In stock',
  low: 'Low',
  out: 'Out of stock',
}

export const statusTone: Record<StockStatus, Parameters<typeof Badge>[0]['tone']> = {
  in: 'success',
  low: 'warning',
  out: 'danger',
}

export const reasonLabel: Record<StockMovementReason, string> = {
  initial: 'Opening stock',
  sale: 'Sale',
  return: 'Return',
  restock: 'Restock',
  adjustment: 'Adjustment',
  damage: 'Damage / loss',
  correction: 'Correction',
}

/** reasons a person picks manually when adjusting */
export const adjustReasons: StockMovementReason[] = [
  'restock',
  'adjustment',
  'return',
  'damage',
  'correction',
]

export const reasonTone: Record<StockMovementReason, Parameters<typeof Badge>[0]['tone']> = {
  initial: 'neutral',
  sale: 'accent',
  return: 'success',
  restock: 'success',
  adjustment: 'neutral',
  damage: 'danger',
  correction: 'warning',
}
