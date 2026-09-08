import { useState } from 'react'
import { Button } from '@/shared/ui'
import type { Product } from '@/shared/types'
import { useInventory } from '../context/InventoryContext'
import { StockStatusBadge } from './StockStatusBadge'
import { StockHistory } from './StockHistory'
import { StockDialog } from './StockDialog'

/** Embedded in ProductForm when editing — replaces the raw stock number field. */
export function ProductStockPanel({ product }: { product: Product }) {
  const { statusFor, committedUnits, reorderPointFor } = useInventory()
  const [dialog, setDialog] = useState<'adjust' | 'receive' | null>(null)

  return (
    <div className="rounded-lg border border-border bg-surface-sunken/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-ink-mute">Inventory</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-2xl text-ink">{product.stock}</span>
            <span className="text-caption text-ink-mute">on hand</span>
            <StockStatusBadge status={statusFor(product)} />
          </p>
          <p className="mt-0.5 text-caption text-ink-mute">
            {committedUnits(product.id)} committed · reorders at {reorderPointFor(product)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => setDialog('receive')}>
            Receive
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setDialog('adjust')}>
            Adjust
          </Button>
        </div>
      </div>

      <details className="mt-3 [&_summary]:cursor-pointer">
        <summary className="text-caption text-accent">Recent movements</summary>
        <div className="mt-2">
          <StockHistory productId={product.id} limit={5} />
        </div>
      </details>

      {dialog && (
        <StockDialog product={product} mode={dialog} onClose={() => setDialog(null)} />
      )}
    </div>
  )
}
