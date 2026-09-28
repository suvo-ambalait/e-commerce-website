import { useState, type FormEvent } from 'react'
import { LuBanknote, LuPencil, LuPlus, LuTrash2, LuTruck } from 'react-icons/lu'
import { PageHeader, Panel } from '../components/primitives'
import { Pill } from '../components/TableKit'
import { Button, Field, Input, Modal, Switch } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { formatPrice } from '@/shared/lib/format'
import { makeId } from '@/shared/lib/createStore'
import { zonesStore, type DeliveryZone } from '@/features/marketplace/stores'

const blank: Omit<DeliveryZone, 'id'> = {
  name: '',
  areas: '',
  rate: 100,
  freeOver: 0,
  minDays: 2,
  maxDays: 4,
  codAvailable: true,
  active: true,
}

export function AdminShipping() {
  const [zones, setZones] = zonesStore.useStore()
  const { notify } = useToast()
  const [editing, setEditing] = useState<DeliveryZone | Omit<DeliveryZone, 'id'> | null>(null)

  const update = (id: string, patch: Partial<DeliveryZone>) => setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)))
  const active = zones.filter((z) => z.active)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Delivery zones"
        description="Customers choose their area at checkout. The charge applies to each shop’s parcel."
        action={
          <Button onClick={() => setEditing(blank)}>
            <LuPlus className="h-4 w-4" />
            Add zone
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        <div className="space-y-3">
          {zones.length === 0 && (
            <Panel>
              <p className="text-sm text-ink-mute">No delivery zones. Customers can’t check out until you add one.</p>
            </Panel>
          )}
          {zones.map((z) => (
            <section key={z.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <LuTruck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-ink">
                    {z.name}
                    {!z.active && (
                      <Pill tone="muted" dot>
                        Hidden
                      </Pill>
                    )}
                  </p>
                  <p className="text-sm text-ink-soft">{z.areas}</p>
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <Stat label="Charge" value={formatPrice(z.rate)} />
                    <Stat label="Free over" value={z.freeOver > 0 ? formatPrice(z.freeOver) : 'Never'} />
                    <Stat label="Delivery time" value={`${z.minDays}–${z.maxDays} days`} />
                    <Stat label="Cash on delivery" value={z.codAvailable ? 'Yes' : 'No'} />
                  </dl>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={z.active}
                    onChange={(on) => update(z.id, { active: on })}
                    label={<span className="sr-only">{z.active ? 'Hide zone' : 'Show zone'}</span>}
                  />
                  <Button variant="ghost" size="sm" onClick={() => setEditing(z)} aria-label={`Edit ${z.name}`}>
                    <LuPencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${z.name}`}
                    className="text-danger!"
                    onClick={() => {
                      if (confirm(`Delete ${z.name}?`)) setZones((prev) => prev.filter((x) => x.id !== z.id))
                    }}
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          ))}
        </div>

        <Panel title="What customers see" subtitle="The delivery step at checkout">
          <div className="space-y-2">
            {active.map((z, i) => (
              <div
                key={z.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${i === 0 ? 'border-accent! bg-accent-soft/60' : 'border-border-strong'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{z.name}</span>
                  <span className="block truncate text-[11px] text-ink-mute">
                    {z.minDays}–{z.maxDays} days
                    {z.codAvailable && ' · cash on delivery'}
                  </span>
                </span>
                <span className="text-sm font-bold text-ink tabular-nums">{formatPrice(z.rate)}</span>
              </div>
            ))}
            {active.length === 0 && <p className="text-sm text-ink-mute">No zones are showing.</p>}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-caption text-ink-mute">
            <LuBanknote className="h-3.5 w-3.5" />
            Zones without cash on delivery ask for bKash, Nagad or card.
          </p>
        </Panel>
      </div>

      {editing && (
        <ZoneModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(z) => {
            setZones((prev) => (prev.some((x) => x.id === z.id) ? prev.map((x) => (x.id === z.id ? z : x)) : [...prev, z]))
            setEditing(null)
            notify('Delivery zone saved', 'success')
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-mute">{label}</dt>
      <dd className="font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  )
}

function ZoneModal({
  initial,
  onClose,
  onSave,
}: {
  initial: DeliveryZone | Omit<DeliveryZone, 'id'>
  onClose: () => void
  onSave: (z: DeliveryZone) => void
}) {
  const [form, setForm] = useState(initial)
  const num = (key: 'rate' | 'freeOver' | 'minDays' | 'maxDays') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
  const badDays = form.maxDays < form.minDays

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (badDays) return
    onSave({ ...form, id: 'id' in form ? form.id : makeId('z') } as DeliveryZone)
  }

  return (
    <Modal open onClose={onClose} title={'id' in initial ? 'Edit zone' : 'New delivery zone'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Zone name" required>
          {(id) => <Input id={id} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Chattogram city" />}
        </Field>
        <Field label="Areas covered" required hint="Shown to customers, e.g. districts or cities">
          {(id) => <Input id={id} required value={form.areas} onChange={(e) => setForm((f) => ({ ...f, areas: e.target.value }))} />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Charge per parcel (৳)" required>
            {(id) => <Input id={id} required type="number" min={0} value={form.rate} onChange={num('rate')} />}
          </Field>
          <Field label="Free over (৳)" hint="0 = never free">
            {(id) => <Input id={id} type="number" min={0} value={form.freeOver} onChange={num('freeOver')} />}
          </Field>
          <Field label="Fastest (days)" required>
            {(id) => <Input id={id} required type="number" min={0} value={form.minDays} onChange={num('minDays')} />}
          </Field>
          <Field label="Slowest (days)" required error={badDays ? 'Must be at least the fastest time' : undefined}>
            {(id) => <Input id={id} required type="number" min={0} value={form.maxDays} onChange={num('maxDays')} />}
          </Field>
        </div>
        <Switch checked={form.codAvailable} onChange={(v) => setForm((f) => ({ ...f, codAvailable: v }))} label="Offer cash on delivery" />
        <Switch checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Show at checkout" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={badDays}>
            Save zone
          </Button>
        </div>
      </form>
    </Modal>
  )
}
