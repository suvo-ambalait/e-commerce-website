import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, StatCard } from '@/features/admin/components/primitives'
import { Button, ButtonLink, Field, Input } from '@/shared/ui'
import { formatPrice } from '@/shared/lib/format'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Product } from '@/shared/types'
import { useInventory } from '../context/InventoryContext'
import { StockStatusBadge } from './StockStatusBadge'
import { StockHistory } from './StockHistory'
import { StockDialog } from './StockDialog'

export function InventoryDetailView({
  product,
  backTo,
  showVendor,
}: {
  product: Product | undefined
  backTo: string
  showVendor: boolean
}) {
  const { patchProduct } = useCatalog()
  const { getVendor } = useVendors()
  const { statusFor, committedUnits, reorderPointFor } = useInventory()
  const [dialog, setDialog] = useState<'adjust' | 'receive' | null>(null)

  if (!product) {
    return (
      <div>
        <p className="text-sm text-ink-mute">Product not found.</p>
        <ButtonLink to={backTo} variant="secondary" className="mt-4">
          Back to inventory
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to={backTo} className="text-caption text-accent hover:underline">
        ← Inventory
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <img src={product.images[0]} alt="" className="h-16 w-16 rounded-md object-cover" />
          <div>
            <PageHeader title={product.name} description={`SKU ${product.sku}`} />
            <p className="mt-1 flex items-center gap-2 text-caption text-ink-mute">
              <StockStatusBadge status={statusFor(product)} />
              {product.category}
              {showVendor && <> · {getVendor(product.vendorId)?.name}</>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setDialog('receive')}>
            Receive
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDialog('adjust')}>
            Adjust
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="On hand" value={String(product.stock)} />
        <StatCard label="Committed" value={String(committedUnits(product.id))} hint="in open orders" />
        <StatCard label="Retail value" value={formatPrice(Math.max(0, product.stock) * product.price)} />
        <StatCard label="Reorder point" value={String(reorderPointFor(product))} />
      </div>

      <div className="max-w-xs rounded-lg border border-border bg-surface p-4">
        <Field label="Reorder point" hint="Blank uses the store default">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={0}
              defaultValue={product.reorderPoint ?? ''}
              onBlur={(e) =>
                patchProduct(product.id, {
                  reorderPoint: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)),
                })
              }
            />
          )}
        </Field>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-3 text-sm font-medium text-ink">Movement history</h3>
        <StockHistory productId={product.id} />
      </div>

      {dialog && <StockDialog product={product} mode={dialog} onClose={() => setDialog(null)} />}
    </div>
  )
}
