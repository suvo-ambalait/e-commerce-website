import { useState, type FormEvent } from 'react'
import { Button, Checkbox, Field, Modal, Select, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import { makeId } from '@/shared/lib/createStore'
import type { Order, Shipment } from '@/shared/types'
import { returnReasons, returnsStore, type ReturnKind, type ReturnReason } from '@/features/marketplace/stores'

/** Customer form to cancel an unshipped parcel or return items from a delivered one. */
export function ReturnRequestModal({
  open,
  onClose,
  kind,
  order,
  shipment,
  customerName,
}: {
  open: boolean
  onClose: () => void
  kind: ReturnKind
  order: Order
  shipment: Shipment
  customerName: string
}) {
  const { notify } = useToast()
  const [, setReturns] = returnsStore.useStore()
  const [selected, setSelected] = useState<string[]>(() => shipment.items.map((i) => i.key))
  const [reason, setReason] = useState<ReturnReason>(kind === 'cancel' ? 'Ordered by mistake' : 'Damaged or faulty')
  const [details, setDetails] = useState('')
  const [resolution, setResolution] = useState<'Refund' | 'Exchange'>('Refund')

  const isCancel = kind === 'cancel'
  // a cancellation covers the whole parcel
  const items = isCancel ? shipment.items : shipment.items.filter((i) => selected.includes(i.key))
  const amount = isCancel ? shipment.total : items.reduce((n, i) => n + i.price * i.quantity, 0)

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    const now = new Date().toISOString()
    setReturns((prev) => [
      {
        id: makeId(isCancel ? 'can' : 'ret'),
        kind,
        orderNumber: order.orderNumber,
        vendorId: shipment.vendorId,
        email: order.email,
        customerName,
        items: items.map((i) => ({ key: i.key, name: i.name, image: i.image, quantity: i.quantity, price: i.price })),
        reason,
        details: details.trim(),
        resolution: isCancel ? 'Refund' : resolution,
        amount,
        status: 'Requested',
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ])
    notify(isCancel ? 'Cancellation requested' : 'Return requested — we’ll email you the next steps', 'success')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isCancel ? 'Cancel this parcel' : 'Request a return'}>
      <form onSubmit={submit} className="space-y-4">
        {isCancel ? (
          <p className="text-sm text-ink-soft">
            The shop has not sent this parcel yet, so you can cancel it. If you already paid, you will get all your money back.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Which items?</p>
            <ul className="space-y-2">
              {shipment.items.map((i) => (
                <li key={i.key} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                  <Checkbox label="" checked={selected.includes(i.key)} onChange={() => toggle(i.key)} aria-label={`Return ${i.name}`} />
                  <img src={i.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{i.name}</span>
                  <span className="text-caption text-ink-mute tabular-nums">×{i.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Field label="Reason" required>
          {(id) => (
            <Select
              id={id}
              value={reason}
              onChange={(v) => setReason(v as ReturnReason)}
              options={returnReasons.map((r) => ({ value: r, label: r }))}
            />
          )}
        </Field>

        <Field label="Anything else we should know?" hint={isCancel ? undefined : 'Photos help us solve it faster. You can send them in reply to our email.'}>
          {(id) => <Textarea id={id} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />}
        </Field>

        {!isCancel && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">What would you like?</p>
            <div className="grid grid-cols-2 gap-2">
              {(['Refund', 'Exchange'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={resolution === r}
                  onClick={() => setResolution(r)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                    resolution === r ? 'border-accent! bg-accent-soft text-accent' : 'border-border-strong text-ink-soft hover:text-ink',
                  )}
                >
                  {r === 'Refund' ? 'A refund' : 'An exchange'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunken/70 px-4 py-3 text-sm">
          <span className="text-ink-mute">{isCancel ? 'Refund if already paid' : 'Estimated refund'}</span>
          <span className="font-bold text-ink tabular-nums">{formatPrice(amount)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button type="submit" disabled={items.length === 0} variant={isCancel ? 'danger' : 'primary'}>
            {isCancel ? 'Cancel parcel' : 'Send request'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
