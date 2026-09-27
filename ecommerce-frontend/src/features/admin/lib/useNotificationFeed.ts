import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { formatPrice } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useVendors } from '@/features/vendor/context/VendorContext'

export type NoteKind = 'order' | 'stock' | 'vendor' | 'review'

export interface NoteAction {
  label: string
  primary?: boolean
  /** navigate here… */
  to?: string
  /** …or run this (the note is marked read either way) */
  run?: () => void
}

export interface Note {
  id: string
  kind: NoteKind
  title: string
  body: string
  /** ISO timestamp */
  date: string
  image?: string
  to: string
  actions: NoteAction[]
  severity?: 'warning' | 'danger'
}

/* read-state store shared by every hook instance (bell, sidebar badge, page) */
const READ_KEY = 'admin:notes-read'
let readIdsStore: string[] = (() => {
  try {
    return JSON.parse(window.localStorage.getItem(READ_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
})()
const listeners = new Set<() => void>()
function setReadIdsStore(next: (prev: string[]) => string[]) {
  readIdsStore = next(readIdsStore)
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify(readIdsStore))
  } catch {
    /* storage unavailable — keep in memory */
  }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const getReadIds = () => readIdsStore

export const kindLabels: Record<NoteKind, string> = {
  order: 'Order',
  stock: 'Stock',
  vendor: 'Vendor',
  review: 'Review',
}

/**
 * Admin notification feed, derived from live marketplace data (orders, stock,
 * vendor applications, reviews). Read state persists in localStorage.
 */
export function useNotificationFeed() {
  const { orders } = useOrders()
  const { products, reviews, getProduct } = useCatalog()
  const { statusFor, movementsFor } = useInventory()
  const { vendors, getVendor, setStatus } = useVendors()
  const readIds = useSyncExternalStore(subscribe, getReadIds)

  const notes = useMemo<Note[]>(() => {
    const list: Note[] = []

    for (const o of [...orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)) {
      const first = o.shipments[0]?.items[0]
      const makers = o.shipments.map((s) => getVendor(s.vendorId)?.name).filter(Boolean).join(', ')
      list.push({
        id: `order-${o.orderNumber}`,
        kind: 'order',
        title: `New order ${o.orderNumber}`,
        body: [first?.name, formatPrice(o.grandTotal), makers].filter(Boolean).join(' · '),
        date: o.date,
        image: first?.image,
        to: `/admin/orders/${o.orderNumber}`,
        actions: [{ label: 'View order', primary: true, to: `/admin/orders/${o.orderNumber}` }],
      })
    }

    for (const p of products) {
      const status = statusFor(p)
      if (status === 'in') continue
      const lastMove = movementsFor(p.id).reduce<string | undefined>(
        (latest, m) => (!latest || m.date > latest ? m.date : latest),
        undefined,
      )
      const vendor = getVendor(p.vendorId)
      list.push({
        id: `stock-${p.id}-${status}-${p.stock}`,
        kind: 'stock',
        severity: status === 'out' ? 'danger' : 'warning',
        title: `${status === 'out' ? 'Out of stock' : 'Low stock'}: ${p.name}`,
        body: `${vendor?.name ?? 'Unknown maker'} · ${p.stock} left`,
        date: lastMove ?? p.createdAt,
        image: p.images[0],
        to: `/admin/inventory/${p.id}`,
        actions: [
          { label: 'Restock', primary: true, to: `/admin/inventory/${p.id}` },
          ...(vendor ? [{ label: 'Contact maker', to: `/admin/vendors/${vendor.id}` }] : []),
        ],
      })
    }

    for (const v of vendors.filter((x) => x.status === 'pending')) {
      list.push({
        id: `vendor-${v.id}`,
        kind: 'vendor',
        title: 'New shop application',
        body: `${v.name} wants to sell on AmbalaEshop`,
        date: v.joinedAt,
        image: v.logo,
        to: `/admin/vendors/${v.id}`,
        actions: [
          { label: 'Approve', primary: true, run: () => setStatus(v.id, 'active') },
          { label: 'Review', to: `/admin/vendors/${v.id}` },
        ],
      })
    }

    for (const r of [...reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)) {
      const product = getProduct(r.productId)
      list.push({
        id: `review-${r.id}`,
        kind: 'review',
        title: `New ${r.rating}-star review`,
        body: [product?.name, product && getVendor(product.vendorId)?.name].filter(Boolean).join(' · ') || r.title,
        date: r.date,
        image: product?.images[0],
        to: '/admin/reviews',
        actions: [],
      })
    }

    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [orders, products, reviews, vendors, statusFor, movementsFor, getVendor, getProduct, setStatus])

  const isUnread = useCallback((id: string) => !readIds.includes(id), [readIds])
  const markRead = useCallback(
    (id: string) => setReadIdsStore((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [],
  )
  const markAllRead = useCallback(
    () => setReadIdsStore((prev) => [...new Set([...prev, ...notes.map((n) => n.id)])]),
    [notes],
  )
  const unreadCount = notes.filter((n) => !readIds.includes(n.id)).length

  return { notes, isUnread, markRead, markAllRead, unreadCount }
}

/** "5 min ago", "3 h ago", "Yesterday", "Sep 14" */
export function relativeTime(iso: string, now = new Date()) {
  const d = new Date(iso)
  const mins = Math.round((now.getTime() - d.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 60 * 24 && d.toDateString() === now.toDateString()) return `${Math.round(mins / 60)} h ago`
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

/** Today / Yesterday / Earlier buckets, preserving order. */
export function groupByDay(notes: Note[], now = new Date()) {
  const today = now.toDateString()
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  const yesterday = y.toDateString()
  const groups: { label: string; items: Note[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ]
  for (const n of notes) {
    const day = new Date(n.date).toDateString()
    groups[day === today ? 0 : day === yesterday ? 1 : 2].items.push(n)
  }
  return groups.filter((g) => g.items.length)
}
