import { useState, type FormEvent } from 'react'
import { PageHeader } from '../components/primitives'
import { Button, Field, Input } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { useSettings, type StoreSettings } from '../context/SettingsContext'

export function AdminSettings() {
  const { settings, updateSettings } = useSettings()
  const { notify } = useToast()
  const [form, setForm] = useState<StoreSettings>(settings)

  const set = (key: keyof StoreSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const numeric = ['shippingFlatRate', 'freeShippingThreshold', 'taxRate', 'commissionRate', 'lowStockThreshold']
    setForm((prev) => ({ ...prev, [key]: numeric.includes(key) ? Number(raw) : raw }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    updateSettings(form)
    notify('Settings saved', 'success')
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Store identity and marketplace economics." />
      <form onSubmit={submit} className="max-w-2xl space-y-6">
        <fieldset className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <legend className="px-1 text-caption font-medium uppercase tracking-wide text-ink-mute">Identity</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name">{(id) => <Input id={id} value={form.storeName} onChange={set('storeName')} />}</Field>
            <Field label="Tagline">{(id) => <Input id={id} value={form.tagline} onChange={set('tagline')} />}</Field>
          </div>
          <Field label="Contact email">{(id) => <Input id={id} value={form.contactEmail} onChange={set('contactEmail')} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">{(id) => <Input id={id} value={form.contactPhone} onChange={set('contactPhone')} />}</Field>
            <Field label="Address">{(id) => <Input id={id} value={form.contactAddress} onChange={set('contactAddress')} />}</Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <legend className="px-1 text-caption font-medium uppercase tracking-wide text-ink-mute">Economics</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Flat shipping rate ($, per vendor)">
              {(id) => <Input id={id} type="number" step="0.01" value={form.shippingFlatRate} onChange={set('shippingFlatRate')} />}
            </Field>
            <Field label="Free shipping threshold ($, per vendor)">
              {(id) => <Input id={id} type="number" step="1" value={form.freeShippingThreshold} onChange={set('freeShippingThreshold')} />}
            </Field>
            <Field label="Tax rate (0–1)">
              {(id) => <Input id={id} type="number" step="0.01" min="0" max="1" value={form.taxRate} onChange={set('taxRate')} />}
            </Field>
            <Field label="Commission rate (0–1)" hint="MorerDokan’s cut of each vendor sale">
              {(id) => <Input id={id} type="number" step="0.01" min="0" max="1" value={form.commissionRate} onChange={set('commissionRate')} />}
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <legend className="px-1 text-caption font-medium uppercase tracking-wide text-ink-mute">Inventory</legend>
          <Field label="Low-stock threshold" hint="Products at or below this on-hand count are flagged Low, unless they set their own reorder point">
            {(id) => <Input id={id} type="number" step="1" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />}
          </Field>
        </fieldset>

        <Button type="submit">Save settings</Button>
      </form>
    </div>
  )
}
