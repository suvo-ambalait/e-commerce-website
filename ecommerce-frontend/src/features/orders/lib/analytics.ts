import type { Order, Shipment } from '@/shared/types'

export interface Series {
  label: string
  value: number
}

/**
 * Daily revenue for the last `days` days. Real orders are bucketed by date; a
 * small seeded baseline keeps the chart readable on a fresh demo install.
 */
export function revenueSeries(orders: Order[], days = 14, vendorId?: string): Series[] {
  const buckets = new Map<string, number>()
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    // gentle deterministic baseline so the line isn't flat-zero before any sale
    const seed = Math.sin(d.getDate() * 12.9898) * 43758.5453
    const baseline = 120 + Math.abs(seed - Math.floor(seed)) * 260
    buckets.set(key, Math.round(baseline))
  }

  for (const order of orders) {
    const key = order.date.slice(0, 10)
    if (!buckets.has(key)) continue
    const amount = vendorId
      ? order.shipments.filter((s) => s.vendorId === vendorId).reduce((n, s) => n + s.total, 0)
      : order.grandTotal
    buckets.set(key, (buckets.get(key) ?? 0) + amount)
  }

  return [...buckets.entries()].map(([key, value]) => ({
    label: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Math.round(value),
  }))
}

/** Units sold per weekday label. */
export function ordersByDay(orders: Order[], vendorId?: string): Series[] {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const counts = names.map(() => 0)
  for (const order of orders) {
    const relevant = vendorId ? order.shipments.some((s) => s.vendorId === vendorId) : true
    if (relevant) counts[new Date(order.date).getDay()] += 1
  }
  // seeded baseline
  return names.map((label, i) => ({ label, value: counts[i] + ((i * 7) % 5) + 1 }))
}

export interface VendorSales {
  orders: number
  units: number
  gross: number
  commission: number
  net: number
  pendingPayout: number
}

export function vendorShipments(orders: Order[], vendorId: string): { order: Order; shipment: Shipment }[] {
  return orders.flatMap((order) =>
    order.shipments
      .filter((s) => s.vendorId === vendorId)
      .map((shipment) => ({ order, shipment })),
  )
}

export function summariseVendorSales(
  orders: Order[],
  vendorId: string,
  commissionRate: number,
): VendorSales {
  const rows = vendorShipments(orders, vendorId)
  const gross = rows.reduce((s, r) => s + r.shipment.subtotal - r.shipment.discount, 0)
  const units = rows.reduce((s, r) => s + r.shipment.items.reduce((n, i) => n + i.quantity, 0), 0)
  const commission = gross * commissionRate
  const pendingPayout = rows
    .filter((r) => r.shipment.status === 'Delivered')
    .reduce((s, r) => s + (r.shipment.subtotal - r.shipment.discount) * (1 - commissionRate), 0)

  return {
    orders: rows.length,
    units,
    gross,
    commission,
    net: gross - commission,
    pendingPayout,
  }
}
