import { useState, type FormEvent } from 'react'
import { LuArrowDownToLine, LuBuilding2, LuPencil, LuPlus, LuSmartphone } from 'react-icons/lu'
import { Panel } from '@/features/admin/components/primitives'
import { Pill } from '@/features/admin/components/TableKit'
import { Button, Field, Input, Modal } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { makeId } from '@/shared/lib/createStore'
import {
  MIN_WITHDRAWAL,
  payoutMethodLabel,
  payoutMethodsStore,
  payoutRequestsStore,
  type PayoutMethod,
  type PayoutMethodType,
} from '@/features/marketplace/stores'
import { maskAccount, type VendorBalance } from '@/features/marketplace/payouts'
import { payoutTone } from '@/features/marketplace/labels'

/** Payout method card, withdraw form and withdrawal history for one shop. */
export function PayoutPanels({ vendorId, balance }: { vendorId: string; balance: VendorBalance }) {
  const [methods, setMethods] = payoutMethodsStore.useStore()
  const [requests, setRequests] = payoutRequestsStore.useStore()
  const { notify } = useToast()
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')

  const method = methods[vendorId]
  const history = requests.filter((r) => r.vendorId === vendorId)
  const value = Number(amount)
  const error =
    !amount ? null : value < MIN_WITHDRAWAL ? `The minimum is ${formatPrice(MIN_WITHDRAWAL)}.` : value > balance.available ? 'That’s more than your available balance.' : null

  const withdraw = (e: FormEvent) => {
    e.preventDefault()
    if (!method || error || !value) return
    setRequests((prev) => [
      { id: makeId('po'), vendorId, amount: value, method, status: 'Pending', requestedAt: new Date().toISOString() },
      ...prev,
    ])
    setAmount('')
    notify('Withdrawal requested — usually paid within 3 working days', 'success')
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel
        title="Payout method"
        subtitle="Where we send your earnings"
        aside={
          method && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <LuPencil className="h-3.5 w-3.5" />
              Change
            </Button>
          )
        }
      >
        {method ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-sunken/50 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              {method.type === 'bank' ? <LuBuilding2 className="h-5 w-5" /> : <LuSmartphone className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink">
                {method.type === 'bank' ? method.bankName : payoutMethodLabel[method.type]} · {maskAccount(method.accountNumber)}
              </p>
              <p className="truncate text-caption text-ink-mute">
                {method.accountName}
                {method.branch && ` · ${method.branch} branch`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong p-5">
            <p className="text-sm text-ink-soft">Add a bank account or mobile wallet before you can withdraw.</p>
            <Button size="sm" onClick={() => setEditing(true)}>
              <LuPlus className="h-4 w-4" />
              Add payout method
            </Button>
          </div>
        )}
      </Panel>

      <Panel title="Withdraw" subtitle={`Available now: ${formatPrice(balance.available)}`}>
        <form onSubmit={withdraw} className="space-y-3">
          <Field label="Amount" error={error ?? undefined} hint={`Minimum ${formatPrice(MIN_WITHDRAWAL)}`}>
            {(id) => (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-mute">৳</span>
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!method || balance.available < MIN_WITHDRAWAL}
                    aria-invalid={Boolean(error) || undefined}
                    className="pl-8!"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!method || balance.available < MIN_WITHDRAWAL}
                  onClick={() => setAmount(String(balance.available))}
                >
                  Max
                </Button>
              </div>
            )}
          </Field>
          <Button type="submit" fullWidth disabled={!method || !value || Boolean(error)}>
            <LuArrowDownToLine className="h-4 w-4" />
            Request withdrawal
          </Button>
          <p className="text-caption text-ink-mute">
            {!method
              ? 'Add a payout method first.'
              : balance.available < MIN_WITHDRAWAL
                ? `You can withdraw once you have at least ${formatPrice(MIN_WITHDRAWAL)} released.`
                : `Sent to ${method.type === 'bank' ? method.bankName : payoutMethodLabel[method.type]} ${maskAccount(method.accountNumber)}.`}
          </p>
        </form>
      </Panel>

      <Panel title="Withdrawal history" className="lg:col-span-2">
        {history.length === 0 ? (
          <p className="text-sm text-ink-mute">No withdrawals yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {payoutMethodLabel[r.method.type]} · {maskAccount(r.method.accountNumber)}
                  </p>
                  <p className="text-caption text-ink-mute">
                    Requested {formatDate(r.requestedAt)}
                    {r.processedAt && ` · ${r.status === 'Paid' ? 'paid' : 'declined'} ${formatDate(r.processedAt)}`}
                    {r.reference && ` · Ref. ${r.reference}`}
                    {r.note && ` · ${r.note}`}
                  </p>
                </div>
                <Pill tone={payoutTone[r.status]} dot>
                  {r.status}
                </Pill>
                <p className="w-28 text-right font-bold text-ink tabular-nums">{formatPrice(r.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {editing && (
        <PayoutMethodModal
          initial={method}
          onClose={() => setEditing(false)}
          onSave={(m) => {
            setMethods((prev) => ({ ...prev, [vendorId]: m }))
            setEditing(false)
            notify('Payout method saved', 'success')
          }}
        />
      )}
    </div>
  )
}

const methodTypes: { value: PayoutMethodType; label: string }[] = [
  { value: 'bank', label: 'Bank account' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
]

function PayoutMethodModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: PayoutMethod
  onClose: () => void
  onSave: (m: PayoutMethod) => void
}) {
  const [form, setForm] = useState<PayoutMethod>(
    initial ?? { type: 'bkash', accountName: '', accountNumber: '', bankName: '', branch: '', routingNumber: '', updatedAt: '' },
  )
  const set = (key: keyof PayoutMethod) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const isBank = form.type === 'bank'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...form, updatedAt: new Date().toISOString() })
  }

  return (
    <Modal open onClose={onClose} title="Payout method">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {methodTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={form.type === t.value}
              onClick={() => setForm((f) => ({ ...f, type: t.value }))}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                form.type === t.value ? 'border-accent! bg-accent-soft text-accent' : 'border-border-strong text-ink-soft hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Field label={isBank ? 'Account holder name' : 'Name on the wallet'} required>
          {(id) => <Input id={id} required value={form.accountName} onChange={set('accountName')} />}
        </Field>
        <Field label={isBank ? 'Account number' : 'Wallet number'} required hint={isBank ? undefined : 'A personal or merchant number, e.g. 01712345678'}>
          {(id) => <Input id={id} required inputMode="numeric" value={form.accountNumber} onChange={set('accountNumber')} />}
        </Field>
        {isBank && (
          <>
            <Field label="Bank name" required>
              {(id) => <Input id={id} required value={form.bankName ?? ''} onChange={set('bankName')} placeholder="e.g. Dutch-Bangla Bank" />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Branch" required>
                {(id) => <Input id={id} required value={form.branch ?? ''} onChange={set('branch')} />}
              </Field>
              <Field label="Routing number">
                {(id) => <Input id={id} inputMode="numeric" value={form.routingNumber ?? ''} onChange={set('routingNumber')} />}
              </Field>
            </div>
          </>
        )}
        <p className="rounded-xl bg-surface-sunken/70 px-3.5 py-2.5 text-caption text-ink-soft">
          The name must match the shop owner’s. Withdrawals already requested still go to the old details.
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
