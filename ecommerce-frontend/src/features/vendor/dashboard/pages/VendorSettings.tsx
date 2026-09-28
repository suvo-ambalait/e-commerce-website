import { useState, type FormEvent, type ReactNode } from 'react'
import { LuBell, LuPackage, LuTreePalm, LuTruck } from 'react-icons/lu'
import { PageHeader } from '@/features/admin/components/primitives'
import { Button, Field, Input, Switch, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import { defaultShopSettings, shopSettingsStore, zonesStore, type ShopSettings } from '@/features/marketplace/stores'
import { useCurrentVendor } from '../../lib/useCurrentVendor'

export function VendorSettings() {
  const vendor = useCurrentVendor()
  const [all, setAll] = shopSettingsStore.useStore()
  const [zones] = zonesStore.useStore()
  const { notify } = useToast()

  const saved: ShopSettings = { ...defaultShopSettings, shipsFrom: vendor?.location ?? '', ...(vendor ? all[vendor.id] : {}) }
  const [form, setForm] = useState<ShopSettings>(saved)

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const activeZones = zones.filter((z) => z.active)
  // empty list = delivers everywhere
  const servesAll = form.zoneIds.length === 0
  const serves = (id: string) => servesAll || form.zoneIds.includes(id)

  const toggleZone = (id: string) =>
    setForm((f) => {
      const current = f.zoneIds.length === 0 ? activeZones.map((z) => z.id) : f.zoneIds
      const next = current.includes(id) ? current.filter((z) => z !== id) : [...current, id]
      return { ...f, zoneIds: next.length === activeZones.length ? [] : next }
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setAll((prev) => ({ ...prev, [vendor.id]: form }))
    notify('Shop settings saved', 'success')
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Shop settings" description="Delivery, holidays and which alerts you get." />

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        <div className="space-y-4">
          <Section icon={<LuPackage className="h-4 w-4" />} title="Order handling">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Packing time" hint="Business days before you hand the parcel to the courier">
                {(id) => (
                  <div className="relative">
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      max={30}
                      value={form.processingDays}
                      onChange={(e) => setForm((f) => ({ ...f, processingDays: Number(e.target.value) }))}
                      className="pr-14!"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-mute">days</span>
                  </div>
                )}
              </Field>
              <Field label="Ships from" hint="Shown to customers on your products">
                {(id) => <Input id={id} value={form.shipsFrom} onChange={(e) => setForm((f) => ({ ...f, shipsFrom: e.target.value }))} placeholder="Mirpur, Dhaka" />}
              </Field>
            </div>
          </Section>

          <Section icon={<LuTruck className="h-4 w-4" />} title="Where you deliver" subtitle="Delivery charges are set by AmbalaEshop for each area.">
            <div className="grid gap-2.5">
              {activeZones.map((z) => (
                <label
                  key={z.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors',
                    serves(z.id) ? 'border-accent/60! bg-accent-soft/40' : 'border-border-strong',
                  )}
                >
                  <input type="checkbox" checked={serves(z.id)} onChange={() => toggleZone(z.id)} className="h-4 w-4 accent-[#6d28d9]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{z.name}</span>
                    <span className="block truncate text-caption text-ink-mute">
                      {z.areas} · {z.minDays + form.processingDays}–{z.maxDays + form.processingDays} days including packing
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ink tabular-nums">{formatPrice(z.rate)}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section icon={<LuTreePalm className="h-4 w-4" />} title="Holiday mode" subtitle="Pause your shop without hiding it. Customers see your message.">
            <Switch
              checked={form.holiday.on}
              onChange={(on) => setForm((f) => ({ ...f, holiday: { ...f.holiday, on } }))}
              label={<span className="font-semibold text-ink">{form.holiday.on ? 'Your shop is on holiday' : 'Holiday mode is off'}</span>}
            />
            {form.holiday.on && (
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_12rem]">
                <Field label="Message to customers">
                  {(id) => (
                    <Textarea
                      id={id}
                      rows={3}
                      value={form.holiday.message}
                      onChange={(e) => setForm((f) => ({ ...f, holiday: { ...f.holiday, message: e.target.value } }))}
                    />
                  )}
                </Field>
                <Field label="Back on">
                  {(id) => (
                    <Input
                      id={id}
                      type="date"
                      value={form.holiday.returnsOn}
                      onChange={(e) => setForm((f) => ({ ...f, holiday: { ...f.holiday, returnsOn: e.target.value } }))}
                    />
                  )}
                </Field>
              </div>
            )}
          </Section>

          <Section icon={<LuBell className="h-4 w-4" />} title="Email alerts" subtitle={`Sent to ${vendor.ownerEmail}`}>
            <div className="space-y-3">
              <Switch checked={form.notifyNewOrder} onChange={(v) => setForm((f) => ({ ...f, notifyNewOrder: v }))} label="A new order comes in" />
              <Switch checked={form.notifyLowStock} onChange={(v) => setForm((f) => ({ ...f, notifyLowStock: v }))} label="A product is running low" />
              <Switch checked={form.notifyReturns} onChange={(v) => setForm((f) => ({ ...f, notifyReturns: v }))} label="A customer asks for a return or cancellation" />
            </div>
          </Section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6">
          {form.holiday.on && (
            <div className="rounded-2xl border border-warning/40! bg-warning-soft p-4 text-sm">
              <p className="font-semibold text-warning">Customers will see</p>
              <p className="mt-1 text-ink-soft">“{form.holiday.message}”</p>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-caption text-ink-mute">{dirty ? 'You have unsaved changes.' : 'Everything is saved.'}</p>
            <Button type="submit" fullWidth className="mt-3" disabled={!dirty}>
              Save settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Section({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
        <div>
          <h3 className="font-display! text-base font-bold! tracking-[-0.01em]! text-ink">{title}</h3>
          {subtitle && <p className="text-caption text-ink-mute">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
