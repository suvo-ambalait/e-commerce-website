import { useCallback, useMemo } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'
import { useOrders } from '@/features/orders/context/OrdersContext'
import type { Order, ShipmentStatus, ShippingInfo } from '@/shared/types'

/**
 * Stand-in customer until login is connected to the backend — the same idea as
 * `useCurrentVendor` in the vendor dashboard. Replace PREVIEW_EMAIL with the
 * signed-in user's email once auth state exists.
 */
const PREVIEW_EMAIL = 'jordan@example.com'

export interface CustomerProfile {
  name: string
  email: string
  phone: string
}

export function useCustomer() {
  const { orders: allOrders } = useOrders()
  const [saved, setSaved] = usePersistedState<Partial<CustomerProfile> | null>(storageKeys.accountProfile, null)

  const orders = useMemo<Order[]>(
    () =>
      allOrders
        .filter((o) => o.email.toLowerCase() === PREVIEW_EMAIL)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allOrders],
  )

  // the latest order fills in anything the customer hasn't set themselves
  const latest = orders[0]?.shippingInfo
  const profile: CustomerProfile = {
    name: saved?.name || latest?.fullName || PREVIEW_EMAIL.split('@')[0],
    email: PREVIEW_EMAIL,
    phone: saved?.phone ?? latest?.phone ?? '',
  }

  const updateProfile = useCallback(
    (patch: Pick<CustomerProfile, 'name' | 'phone'>) => setSaved((prev) => ({ ...prev, ...patch })),
    [setSaved],
  )

  const address: ShippingInfo | undefined = latest
  const spent = orders.reduce((n, o) => n + o.grandTotal, 0)

  return { profile, updateProfile, orders, address, spent }
}

/* ---------------------------- order status --------------------------- */

export type OrderProgress = 'Processing' | 'On the way' | 'Delivered' | 'Cancelled'

/** One status for the whole order, from its per-shop parcels. */
export function orderProgress(order: Order): OrderProgress {
  const live = order.shipments.filter((s) => s.status !== 'Cancelled')
  if (live.length === 0) return 'Cancelled'
  if (live.every((s) => s.status === 'Delivered')) return 'Delivered'
  if (live.some((s) => s.status === 'Shipped' || s.status === 'Delivered')) return 'On the way'
  return 'Processing'
}

export const progressTone: Record<OrderProgress, 'warning' | 'accent' | 'success' | 'danger'> = {
  Processing: 'warning',
  'On the way': 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
}

export const shipmentSteps: ShipmentStatus[] = ['Processing', 'Shipped', 'Delivered']

export const itemCount = (order: Order) =>
  order.shipments.reduce((n, s) => n + s.items.reduce((m, i) => m + i.quantity, 0), 0)

export const formatAddress = (a: ShippingInfo) =>
  [a.address, [a.city, a.state].filter(Boolean).join(', '), a.zip, a.country].filter(Boolean).join(' · ')
