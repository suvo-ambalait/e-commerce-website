import { useCallback, useMemo } from 'react'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { payoutRequestsStore, returnsStore, vendorReadStore } from '@/features/marketplace/stores'
import { formatPrice } from '@/shared/lib/format'

export type VendorNoteKind = 'order' | 'stock' | 'return' | 'payout'

export interface VendorNote {
  id: string
  kind: VendorNoteKind
  title: string
  body: string
  date: string
  to: string
  urgent?: boolean
}

/** A shop's notification feed, built from its orders, stock, returns and payouts. */
export function useVendorNotifications(vendorId: string | undefined) {
  const { orders } = useOrders()
  const { products } = useCatalog()
  const { statusFor } = useInventory()
  const [returns] = returnsStore.useStore()
  const [payouts] = payoutRequestsStore.useStore()
  const [readMap, setReadMap] = vendorReadStore.useStore()

  const notes = useMemo<VendorNote[]>(() => {
    if (!vendorId) return []
    const now = new Date().toISOString()
    const list: VendorNote[] = []

    for (const o of orders) {
      const s = o.shipments.find((x) => x.vendorId === vendorId)
      if (!s || s.status !== 'Processing') continue
      const units = s.items.reduce((n, i) => n + i.quantity, 0)
      list.push({
        id: `order:${o.orderNumber}`,
        kind: 'order',
        title: `New order ${o.orderNumber}`,
        body: `${units} ${units === 1 ? 'item' : 'items'} to pack for ${o.shippingInfo.fullName} · ${formatPrice(s.total)}`,
        date: o.date,
        to: `/vendor/dashboard/orders/${o.orderNumber}`,
        urgent: true,
      })
    }

    for (const p of products) {
      if (p.vendorId !== vendorId) continue
      const status = statusFor(p)
      if (status === 'in') continue
      list.push({
        id: `stock:${p.id}:${status}`,
        kind: 'stock',
        title: status === 'out' ? `Out of stock: ${p.name}` : `Running low: ${p.name}`,
        body: status === 'out' ? 'Customers can’t buy it until you restock.' : `Only ${p.stock} left.`,
        date: now,
        to: `/vendor/dashboard/inventory/${p.id}`,
        urgent: status === 'out',
      })
    }

    for (const r of returns) {
      if (r.vendorId !== vendorId) continue
      list.push({
        id: `return:${r.id}:${r.status}`,
        kind: 'return',
        title: r.status === 'Requested' ? `${r.kind === 'cancel' ? 'Cancellation' : 'Return'} request on ${r.orderNumber}` : `Request ${r.status.toLowerCase()}: ${r.orderNumber}`,
        body: `${r.customerName} · ${r.reason} · ${formatPrice(r.amount)}`,
        date: r.updatedAt,
        to: '/vendor/dashboard/returns',
        urgent: r.status === 'Requested',
      })
    }

    for (const p of payouts) {
      if (p.vendorId !== vendorId || p.status === 'Pending' || !p.processedAt) continue
      list.push({
        id: `payout:${p.id}:${p.status}`,
        kind: 'payout',
        title: p.status === 'Paid' ? `${formatPrice(p.amount)} paid out` : `Withdrawal of ${formatPrice(p.amount)} declined`,
        body: p.status === 'Paid' ? `Reference ${p.reference ?? '—'}` : (p.note ?? 'Contact us for details.'),
        date: p.processedAt,
        to: '/vendor/dashboard/payouts',
      })
    }

    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [vendorId, orders, products, statusFor, returns, payouts])

  const read = useMemo(() => new Set(vendorId ? (readMap[vendorId] ?? []) : []), [readMap, vendorId])
  const isUnread = useCallback((id: string) => !read.has(id), [read])

  const markRead = useCallback(
    (ids: string[]) => {
      if (!vendorId) return
      setReadMap((prev) => ({ ...prev, [vendorId]: [...new Set([...(prev[vendorId] ?? []), ...ids])] }))
    },
    [vendorId, setReadMap],
  )

  return {
    notes,
    unreadCount: notes.filter((n) => !read.has(n.id)).length,
    isUnread,
    markRead,
    markAllRead: () => markRead(notes.map((n) => n.id)),
  }
}
