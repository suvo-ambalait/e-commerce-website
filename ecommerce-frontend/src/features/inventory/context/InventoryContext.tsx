import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'
import type { Order, Product, StockMovement, StockMovementReason } from '@/shared/types'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { stockStatus, type StockStatus } from '../lib/status'
import { parseCsv } from '../lib/csv'
import { seedMovements } from '../data/seedMovements'

export interface RecordInput {
  productId: string
  delta: number
  reason: StockMovementReason
  note?: string
  orderNumber?: string
}

interface InventoryContextValue {
  movements: StockMovement[]
  movementsFor: (productId: string) => StockMovement[]
  committedUnits: (productId: string) => number
  reorderPointFor: (product: Product) => number
  statusFor: (product: Product) => StockStatus
  recordMovement: (input: RecordInput) => void
  setOnHand: (productId: string, newCount: number, reason: StockMovementReason, note?: string) => void
  receive: (productId: string, qty: number, note?: string) => void
  bulkReceive: (entries: { productId: string; qty: number }[], note?: string) => void
  applyOrderSale: (order: Order) => void
  reverseShipment: (orderNumber: string, vendorId: string) => void
  reapplyShipment: (orderNumber: string, vendorId: string) => void
  importCsv: (csv: string) => { updated: number; errors: string[] }
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [movements, setMovements] = usePersistedState<StockMovement[]>(
    storageKeys.movements,
    seedMovements,
  )
  const { products, getProduct, patchProduct } = useCatalog()
  const { orders } = useOrders()
  const { settings } = useSettings()
  const { user } = useAuth()

  const actor = user?.email ?? 'system'

  /** backfill an opening-stock movement for any product that has none (e.g. just created) */
  useEffect(() => {
    const known = new Set(movements.map((m) => m.productId))
    const missing = products.filter((p) => !known.has(p.id))
    if (missing.length === 0) return
    const now = new Date().toISOString()
    setMovements((prev) => [
      ...missing.map((p, i) => ({
        id: `mv-open-${now}-${i}`,
        productId: p.id,
        vendorId: p.vendorId,
        delta: p.stock,
        balanceAfter: p.stock,
        reason: 'initial' as const,
        note: 'Opening stock',
        actor: 'system',
        date: p.createdAt ?? now,
      })),
      ...prev,
    ])
  }, [products, movements, setMovements])

  const movementsFor = useCallback(
    (productId: string) =>
      movements
        .filter((m) => m.productId === productId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [movements],
  )

  /** units sitting in shipments that are placed but not yet shipped/delivered/cancelled */
  const committedUnits = useCallback(
    (productId: string) => {
      let total = 0
      for (const order of orders) {
        for (const shipment of order.shipments) {
          if (shipment.status !== 'Processing') continue
          for (const item of shipment.items) {
            if (item.productId === productId) total += item.quantity
          }
        }
      }
      return total
    },
    [orders],
  )

  const reorderPointFor = useCallback(
    (product: Product) => product.reorderPoint ?? settings.lowStockThreshold,
    [settings.lowStockThreshold],
  )

  const statusFor = useCallback(
    (product: Product) => stockStatus(product.stock, reorderPointFor(product)),
    [reorderPointFor],
  )

  const applyDeltas = useCallback(
    (entries: (RecordInput & { date?: string; actor?: string })[]) => {
      if (entries.length === 0) return
      const now = new Date().toISOString()
      const added: StockMovement[] = []
      const patches = new Map<string, number>()

      for (const entry of entries) {
        const product = getProduct(entry.productId)
        if (!product || entry.delta === 0) continue
        const base = patches.get(entry.productId) ?? product.stock
        const next = base + entry.delta
        patches.set(entry.productId, next)
        added.push({
          id: `mv-${now}-${added.length}-${Math.random().toString(36).slice(2, 6)}`,
          productId: entry.productId,
          vendorId: product.vendorId,
          delta: entry.delta,
          balanceAfter: next,
          reason: entry.reason,
          note: entry.note,
          actor: entry.actor ?? actor,
          orderNumber: entry.orderNumber,
          date: entry.date ?? now,
        })
      }

      if (added.length === 0) return
      patches.forEach((stock, id) => patchProduct(id, { stock }))
      setMovements((prev) => [...added, ...prev])
    },
    [getProduct, patchProduct, setMovements, actor],
  )

  const recordMovement = useCallback<InventoryContextValue['recordMovement']>(
    (input) => applyDeltas([input]),
    [applyDeltas],
  )

  const setOnHand = useCallback<InventoryContextValue['setOnHand']>(
    (productId, newCount, reason, note) => {
      const product = getProduct(productId)
      if (!product) return
      applyDeltas([{ productId, delta: Math.max(0, newCount) - product.stock, reason, note }])
    },
    [applyDeltas, getProduct],
  )

  const receive = useCallback<InventoryContextValue['receive']>(
    (productId, qty, note) => {
      if (qty <= 0) return
      applyDeltas([{ productId, delta: qty, reason: 'restock', note }])
    },
    [applyDeltas],
  )

  const bulkReceive = useCallback<InventoryContextValue['bulkReceive']>(
    (entries, note) =>
      applyDeltas(
        entries
          .filter((e) => e.qty > 0)
          .map((e) => ({ productId: e.productId, delta: e.qty, reason: 'restock', note: note ?? 'Bulk restock' })),
      ),
    [applyDeltas],
  )

  const applyOrderSale = useCallback<InventoryContextValue['applyOrderSale']>(
    (order) =>
      applyDeltas(
        order.shipments.flatMap((s) =>
          s.items.map((item) => ({
            productId: item.productId,
            delta: -item.quantity,
            reason: 'sale' as const,
            orderNumber: order.orderNumber,
            actor: 'system',
          })),
        ),
      ),
    [applyDeltas],
  )

  const shipmentEntries = useCallback(
    (orderNumber: string, vendorId: string, direction: 1 | -1) => {
      const order = orders.find((o) => o.orderNumber === orderNumber)
      const shipment = order?.shipments.find((s) => s.vendorId === vendorId)
      if (!shipment) return
      applyDeltas(
        shipment.items.map((item) => ({
          productId: item.productId,
          delta: direction * item.quantity,
          reason: (direction === 1 ? 'return' : 'sale') as StockMovementReason,
          note: direction === 1 ? `Shipment cancelled (${orderNumber})` : undefined,
          orderNumber,
          actor: 'system',
        })),
      )
    },
    [orders, applyDeltas],
  )

  const reverseShipment = useCallback<InventoryContextValue['reverseShipment']>(
    (orderNumber, vendorId) => shipmentEntries(orderNumber, vendorId, 1),
    [shipmentEntries],
  )
  const reapplyShipment = useCallback<InventoryContextValue['reapplyShipment']>(
    (orderNumber, vendorId) => shipmentEntries(orderNumber, vendorId, -1),
    [shipmentEntries],
  )

  const importCsv = useCallback<InventoryContextValue['importCsv']>(
    (csv) => {
      const { rows, errors } = parseCsv(csv)
      const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]))
      const deltas: RecordInput[] = []
      const reorderPatches = new Map<string, number>()
      let updated = 0

      for (const row of rows) {
        const product = bySku.get(row.sku.toLowerCase())
        if (!product) {
          errors.push(`SKU ${row.sku}: no matching product.`)
          continue
        }
        let touched = false
        if (row.onHand != null && row.onHand !== product.stock) {
          deltas.push({
            productId: product.id,
            delta: row.onHand - product.stock,
            reason: 'correction',
            note: 'CSV import',
          })
          touched = true
        }
        if (row.reorderPoint != null && row.reorderPoint !== (product.reorderPoint ?? -1)) {
          reorderPatches.set(product.id, row.reorderPoint)
          touched = true
        }
        if (touched) updated++
      }

      reorderPatches.forEach((rp, id) => patchProduct(id, { reorderPoint: rp }))
      applyDeltas(deltas)
      return { updated, errors }
    },
    [products, patchProduct, applyDeltas],
  )

  const value = useMemo<InventoryContextValue>(
    () => ({
      movements,
      movementsFor,
      committedUnits,
      reorderPointFor,
      statusFor,
      recordMovement,
      setOnHand,
      receive,
      bulkReceive,
      applyOrderSale,
      reverseShipment,
      reapplyShipment,
      importCsv,
    }),
    [
      movements, movementsFor, committedUnits, reorderPointFor, statusFor, recordMovement,
      setOnHand, receive, bulkReceive, applyOrderSale, reverseShipment, reapplyShipment,
      importCsv,
    ],
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within an InventoryProvider')
  return ctx
}
