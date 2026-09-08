import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'
import type { Order, ShipmentStatus } from '@/shared/types'
import { seedOrders } from '../data/seedOrders'

interface OrdersContextValue {
  orders: Order[]
  addOrder: (order: Order) => void
  ordersFor: (email: string) => Order[]
  ordersForVendor: (vendorId: string) => Order[]
  updateShipmentStatus: (orderNumber: string, vendorId: string, status: ShipmentStatus) => void
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = usePersistedState<Order[]>(storageKeys.orders, seedOrders)

  const addOrder = useCallback((order: Order) => setOrders((prev) => [order, ...prev]), [setOrders])

  const ordersFor = useCallback(
    (email: string) => orders.filter((o) => o.email === email.toLowerCase()),
    [orders],
  )

  const ordersForVendor = useCallback(
    (vendorId: string) => orders.filter((o) => o.shipments.some((s) => s.vendorId === vendorId)),
    [orders],
  )

  const updateShipmentStatus = useCallback<OrdersContextValue['updateShipmentStatus']>(
    (orderNumber, vendorId, status) =>
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === orderNumber
            ? {
                ...o,
                shipments: o.shipments.map((s) => (s.vendorId === vendorId ? { ...s, status } : s)),
              }
            : o,
        ),
      ),
    [setOrders],
  )

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, addOrder, ordersFor, ordersForVendor, updateShipmentStatus }),
    [orders, addOrder, ordersFor, ordersForVendor, updateShipmentStatus],
  )

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within an OrdersProvider')
  return ctx
}
