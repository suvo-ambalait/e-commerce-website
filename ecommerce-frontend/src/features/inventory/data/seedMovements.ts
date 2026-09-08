import type { StockMovement } from '@/shared/types'
import { seedProducts } from '@/features/catalog/data/products'
import { seedOrders } from '@/features/orders/data/seedOrders'

/**
 * A starting stock ledger that reconciles exactly to `seedProducts[].stock`.
 *
 * Each product gets an `initial` movement; some also get an earlier `restock`
 * and the sales pulled from `seedOrders`. The running balance is computed so the
 * final value always equals the product's current on-hand.
 */

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

interface Sale {
  qty: number
  date: string
  orderNumber: string
}

const salesByProduct = new Map<string, Sale[]>()
for (const order of seedOrders) {
  for (const shipment of order.shipments) {
    for (const item of shipment.items) {
      const list = salesByProduct.get(item.productId) ?? []
      list.push({ qty: item.quantity, date: order.date, orderNumber: order.orderNumber })
      salesByProduct.set(item.productId, list)
    }
  }
}

const EXTRA_ADJUSTMENTS: Record<string, { delta: number; reason: StockMovement['reason']; note: string; daysAgo: number }> = {
  p3: { delta: -2, reason: 'damage', note: 'Chipped in the studio — written off', daysAgo: 12 },
  p8: { delta: -1, reason: 'correction', note: 'Miscount during stocktake', daysAgo: 6 },
  p16: { delta: -3, reason: 'damage', note: 'Water damage to two units', daysAgo: 9 },
}

function build(): StockMovement[] {
  const out: StockMovement[] = []

  for (const product of seedProducts) {
    const sales = (salesByProduct.get(product.id) ?? []).sort((a, b) => a.date.localeCompare(b.date))
    const soldTotal = sales.reduce((s, x) => s + x.qty, 0)

    const hasRestock = hash(product.id) % 3 === 0
    const restockQty = hasRestock ? 12 + (hash(product.id) % 4) * 6 : 0

    const adj = EXTRA_ADJUSTMENTS[product.id]
    const adjDelta = adj?.delta ?? 0

    // initial + restock + adjustment + (−sales) must equal current stock
    const initialQty = product.stock + soldTotal - restockQty - adjDelta

    let balance = Math.max(0, initialQty)
    const push = (m: Omit<StockMovement, 'id' | 'balanceAfter'>) => {
      balance += m.delta
      out.push({ ...m, id: `mv-${out.length + 1}`, balanceAfter: balance })
    }

    balance = 0
    push({
      productId: product.id,
      vendorId: product.vendorId,
      delta: Math.max(0, initialQty),
      reason: 'initial',
      note: 'Opening stock',
      actor: 'system',
      date: product.createdAt,
    })

    if (hasRestock) {
      push({
        productId: product.id,
        vendorId: product.vendorId,
        delta: restockQty,
        reason: 'restock',
        note: 'Batch from the workshop',
        actor: 'system',
        date: daysAgo(18 + (hash(product.id) % 10)),
      })
    }

    if (adj) {
      push({
        productId: product.id,
        vendorId: product.vendorId,
        delta: adj.delta,
        reason: adj.reason,
        note: adj.note,
        actor: 'system',
        date: daysAgo(adj.daysAgo),
      })
    }

    for (const sale of sales) {
      push({
        productId: product.id,
        vendorId: product.vendorId,
        delta: -sale.qty,
        reason: 'sale',
        actor: 'system',
        orderNumber: sale.orderNumber,
        date: sale.date,
      })
    }
  }

  return out.sort((a, b) => b.date.localeCompare(a.date))
}

export const seedMovements: StockMovement[] = build()
