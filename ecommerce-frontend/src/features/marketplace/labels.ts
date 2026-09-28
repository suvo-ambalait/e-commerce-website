import type { PillTone } from '@/features/admin/components/TableKit'
import type { PayoutStatus, ReturnStatus, StaffMember } from './stores'

/** Badge / Pill tones shared by customer, vendor and admin screens. */
export const returnTone: Record<ReturnStatus, 'warning' | 'accent' | 'danger' | 'success'> = {
  Requested: 'warning',
  Approved: 'accent',
  Rejected: 'danger',
  Refunded: 'success',
}

export const payoutTone: Record<PayoutStatus, PillTone> = {
  Pending: 'warning',
  Paid: 'success',
  Rejected: 'danger',
}

export const staffStatusTone: Record<StaffMember['status'], PillTone> = {
  Active: 'success',
  Invited: 'warning',
  Suspended: 'danger',
}
