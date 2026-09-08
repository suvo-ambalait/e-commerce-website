import { useState, type FormEvent } from 'react'
import { Button, Field, Input, Modal, Select, Textarea } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/shared/ui/Toast'
import type { Product, StockMovementReason } from '@/shared/types'
import { useInventory } from '../context/InventoryContext'
import { adjustReasons, reasonLabel } from '../lib/status'

export function StockDialog({
  product,
  mode,
  onClose,
}: {
  product: Product | null
  /** 'receive' pre-selects restock and the add-mode */
  mode: 'adjust' | 'receive'
  onClose: () => void
}) {
  const { setOnHand, recordMovement } = useInventory()
  const { notify } = useToast()

  const [op, setOp] = useState<'set' | 'delta'>(mode === 'receive' ? 'delta' : 'set')
  const [count, setCount] = useState('')
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState<StockMovementReason>(mode === 'receive' ? 'restock' : 'adjustment')
  const [note, setNote] = useState('')

  if (!product) return null

  const projected =
    op === 'set'
      ? Number(count || product.stock)
      : product.stock + Number(delta || 0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (op === 'set') {
      setOnHand(product.id, Math.max(0, Number(count)), reason, note.trim() || undefined)
    } else {
      const d = Number(delta)
      if (!d) return
      recordMovement({ productId: product.id, delta: d, reason, note: note.trim() || undefined })
    }
    notify(`${product.name} stock updated`, 'success')
    onClose()
  }

  return (
    <Modal open={!!product} onClose={onClose} title={mode === 'receive' ? 'Receive stock' : 'Adjust stock'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-md bg-surface-sunken p-3 text-sm">
          <p className="font-medium text-ink">{product.name}</p>
          <p className="text-caption text-ink-mute">
            SKU {product.sku} · on hand <span className="tabular-nums text-ink">{product.stock}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {(['set', 'delta'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setOp(value)}
              className={cn(
                'flex-1 rounded-sm border px-3 py-2 text-caption transition-colors',
                op === value ? 'border-transparent bg-ink text-bg' : 'border-border-strong text-ink-soft hover:border-ink',
              )}
            >
              {value === 'set' ? 'Set new count' : 'Add / remove'}
            </button>
          ))}
        </div>

        {op === 'set' ? (
          <Field label="New on-hand count" required>
            {(id) => (
              <Input
                id={id}
                type="number"
                min="0"
                required
                autoFocus
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder={String(product.stock)}
              />
            )}
          </Field>
        ) : (
          <Field label="Change (+ to add, − to remove)" required>
            {(id) => (
              <Input
                id={id}
                type="number"
                required
                autoFocus
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="+10"
              />
            )}
          </Field>
        )}

        <Field label="Reason" required>
          {(id) => (
            <Select
              id={id}
              value={reason}
              onChange={(v) => setReason(v as StockMovementReason)}
              options={adjustReasons.map((r) => ({ value: r, label: reasonLabel[r] }))}
            />
          )}
        </Field>

        <Field label="Note" hint="Optional — shows in the stock history">
          {(id) => <Textarea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>

        <p className="text-caption text-ink-mute">
          New on-hand:{' '}
          <span className="font-medium tabular-nums text-ink">{Math.max(0, projected)}</span>
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  )
}
