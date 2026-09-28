import { useState, type FormEvent } from 'react'
import { LuCopy, LuPause, LuPlay, LuTrash2 } from 'react-icons/lu'
import { PageHeader, Panel, DataTable, type Column } from '@/features/admin/components/primitives'
import { Pill } from '@/features/admin/components/TableKit'
import { Button, Field, Input } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { makeId } from '@/shared/lib/createStore'
import { vendorDiscountsStore, type VendorDiscount } from '@/features/marketplace/stores'
import { useCurrentVendor } from '../../lib/useCurrentVendor'

const blank = { code: '', type: 'percent' as VendorDiscount['type'], value: 10, minSpend: 0, expiresOn: '' }

const isExpired = (d: VendorDiscount) => Boolean(d.expiresOn) && new Date(d.expiresOn) < new Date(new Date().toDateString())

export function VendorDiscounts() {
  const vendor = useCurrentVendor()
  const [all, setAll] = vendorDiscountsStore.useStore()
  const { notify } = useToast()
  const [form, setForm] = useState(blank)

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const mine = all.filter((d) => d.vendorId === vendor.id)
  const code = form.code.trim().toUpperCase()
  const taken = all.some((d) => d.code === code)

  const create = (e: FormEvent) => {
    e.preventDefault()
    if (!code || taken) return
    setAll((prev) => [
      { id: makeId('vd'), vendorId: vendor.id, code, type: form.type, value: form.value, minSpend: form.minSpend, expiresOn: form.expiresOn, active: true, createdAt: new Date().toISOString() },
      ...prev,
    ])
    setForm(blank)
    notify(`Code ${code} created`, 'success')
  }

  const update = (id: string, patch: Partial<VendorDiscount>) => setAll((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  const label = (d: Pick<VendorDiscount, 'type' | 'value'>) => (d.type === 'percent' ? `${d.value}% off` : `${formatPrice(d.value)} off`)

  const columns: Column<VendorDiscount>[] = [
    {
      header: 'Code',
      id: 'code',
      sortValue: (d) => d.code,
      cell: (d) => (
        <span>
          <span className="block font-mono text-sm font-bold tracking-wide text-ink">{d.code}</span>
          <span className="block text-[11px] text-ink-mute">Created {formatDate(d.createdAt)}</span>
        </span>
      ),
    },
    { header: 'Discount', id: 'value', sortValue: (d) => d.value, cell: (d) => <span className="font-semibold text-ink">{label(d)}</span> },
    {
      header: 'Min. spend',
      id: 'min',
      hideBelow: 'md',
      align: 'right',
      sortValue: (d) => d.minSpend,
      cell: (d) => <span className="text-ink-soft tabular-nums">{d.minSpend ? formatPrice(d.minSpend) : '—'}</span>,
    },
    {
      header: 'Expires',
      id: 'expires',
      hideBelow: 'sm',
      sortValue: (d) => d.expiresOn || '9999',
      cell: (d) => <span className="whitespace-nowrap text-ink-mute">{d.expiresOn ? formatDate(d.expiresOn) : 'Never'}</span>,
    },
    {
      header: 'Status',
      id: 'status',
      cell: (d) =>
        isExpired(d) ? (
          <Pill tone="muted" dot>
            Expired
          </Pill>
        ) : d.active ? (
          <Pill tone="success" dot>
            Active
          </Pill>
        ) : (
          <Pill tone="neutral" dot>
            Paused
          </Pill>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Discounts" description="Codes that take money off your products only. You pay for the discount, not AmbalaEshop." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        <DataTable
          rows={mine}
          columns={columns}
          keyOf={(d) => d.id}
          empty="No codes yet. Create one to run a sale or thank repeat customers."
          defaultSort={{ id: 'code', dir: 'asc' }}
          rowActions={[
            {
              label: 'Copy code',
              icon: LuCopy,
              onClick: (d) => {
                void navigator.clipboard?.writeText(d.code)
                notify(`Copied ${d.code}`)
              },
            },
            { label: 'Pause', icon: LuPause, onClick: (d) => update(d.id, { active: false }), hidden: (d) => !d.active },
            { label: 'Resume', icon: LuPlay, onClick: (d) => update(d.id, { active: true }), hidden: (d) => d.active },
            {
              label: 'Delete',
              icon: LuTrash2,
              danger: true,
              onClick: (d) => {
                if (confirm(`Delete ${d.code}?`)) setAll((prev) => prev.filter((x) => x.id !== d.id))
              },
            },
          ]}
        />

        <Panel title="New code" subtitle="Works on items from your shop" className="xl:sticky xl:top-6">
          <form onSubmit={create} className="space-y-4">
            <Field label="Code" required error={taken ? 'That code is already used.' : undefined}>
              {(id) => (
                <Input
                  id={id}
                  required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.replace(/\s/g, '') }))}
                  placeholder="EID20"
                  className="font-mono uppercase"
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-2">
              {(['percent', 'fixed'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={form.type === t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                    form.type === t ? 'border-accent! bg-accent-soft text-accent' : 'border-border-strong text-ink-soft hover:text-ink',
                  )}
                >
                  {t === 'percent' ? 'Percentage' : 'Fixed amount'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={form.type === 'percent' ? 'Percent off' : 'Taka off'} required>
                {(id) => (
                  <Input
                    id={id}
                    required
                    type="number"
                    min={1}
                    max={form.type === 'percent' ? 90 : undefined}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                  />
                )}
              </Field>
              <Field label="Min. spend">
                {(id) => (
                  <Input id={id} type="number" min={0} value={form.minSpend} onChange={(e) => setForm((f) => ({ ...f, minSpend: Number(e.target.value) }))} />
                )}
              </Field>
            </div>
            <Field label="Expires on" hint="Leave empty to keep it running">
              {(id) => <Input id={id} type="date" value={form.expiresOn} onChange={(e) => setForm((f) => ({ ...f, expiresOn: e.target.value }))} />}
            </Field>
            {code && !taken && (
              <p className="rounded-xl bg-accent-soft/60 px-3.5 py-2.5 text-caption text-ink-soft">
                <strong className="font-mono text-ink">{code}</strong> gives {label(form)}
                {form.minSpend > 0 && ` on ${formatPrice(form.minSpend)} or more`} from your shop.
              </p>
            )}
            <Button type="submit" fullWidth disabled={!code || taken}>
              Create code
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  )
}
