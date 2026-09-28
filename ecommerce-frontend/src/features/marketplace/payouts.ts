import type { Order } from '@/shared/types'
import { summariseVendorSales } from '@/features/orders/lib/analytics'
import type { PayoutRequest } from './stores'

export interface VendorBalance {
  /** net earnings from delivered parcels */
  released: number
  /** requested but not yet paid */
  pending: number
  /** already paid out */
  paid: number
  /** what the vendor can withdraw right now */
  available: number
}

/** A shop's withdrawable balance: released earnings minus pending and paid withdrawals. */
export function vendorBalance(orders: Order[], vendorId: string, commissionRate: number, requests: PayoutRequest[]): VendorBalance {
  const released = summariseVendorSales(orders, vendorId, commissionRate).pendingPayout
  const mine = requests.filter((r) => r.vendorId === vendorId)
  const pending = mine.filter((r) => r.status === 'Pending').reduce((n, r) => n + r.amount, 0)
  const paid = mine.filter((r) => r.status === 'Paid').reduce((n, r) => n + r.amount, 0)
  return { released, pending, paid, available: Math.max(0, Math.floor((released - pending - paid) * 100) / 100) }
}

/** `•••• 6789` — hides all but the last four digits of an account number. */
export const maskAccount = (n: string) => {
  const digits = n.replace(/\s/g, '')
  return digits.length <= 4 ? digits : `•••• ${digits.slice(-4)}`
}
