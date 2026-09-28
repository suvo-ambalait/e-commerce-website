import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  LuCircleAlert,
  LuCircleCheck,
  LuMail,
  LuMapPin,
  LuPackage,
  LuPercent,
  LuPhone,
  LuReceipt,
  LuRotateCcw,
  LuStore,
  LuTruck,
} from 'react-icons/lu'
import { PageHeader } from '../components/primitives'
import { Button, Field, Input } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import { calculateOrderTotals } from '@/shared/lib/pricing'
import { useSettings, type StoreSettings } from '../context/SettingsContext'

/** Tax and commission are stored as fractions (0.08) but edited as percentages (8). */
type FormState = Omit<StoreSettings, 'taxRate' | 'commissionRate'> & {
  taxPct: number
  commissionPct: number
}

const toPct = (fraction: number) => Math.round(fraction * 10000) / 100

function toForm({ taxRate, commissionRate, ...rest }: StoreSettings): FormState {
  return { ...rest, taxPct: toPct(taxRate), commissionPct: toPct(commissionRate) }
}

function fromForm({ taxPct, commissionPct, ...rest }: FormState): StoreSettings {
  return { ...rest, taxRate: taxPct / 100, commissionRate: commissionPct / 100 }
}

const NUMERIC: (keyof FormState)[] = [
  'shippingFlatRate',
  'freeShippingThreshold',
  'taxPct',
  'commissionPct',
  'lowStockThreshold',
]

/** Subtotal used for the example order in the sidebar. */
const SAMPLE_SUBTOTAL = 100

export function AdminSettings() {
  const { settings, updateSettings } = useSettings()
  const { notify } = useToast()
  const [form, setForm] = useState<FormState>(() => toForm(settings))

  const saved = useMemo(() => toForm(settings), [settings])
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setForm((prev) => ({ ...prev, [key]: NUMERIC.includes(key) ? Number(raw) : raw }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    updateSettings(fromForm(form))
    notify('Settings saved', 'success')
  }

  const reset = () => setForm(saved)

  // example: one shop basket at the sample subtotal, priced exactly like checkout
  const example = calculateOrderTotals(SAMPLE_SUBTOTAL, 0, {
    shippingFlatRate: form.shippingFlatRate,
    freeShippingThreshold: form.freeShippingThreshold,
    taxRate: form.taxPct / 100,
  })
  const commission = Math.round(SAMPLE_SUBTOTAL * form.commissionPct) / 100
  const payout = SAMPLE_SUBTOTAL - commission

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Store identity, contact details and marketplace economics."
        action={
          <span
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-caption font-semibold',
              dirty ? 'bg-accent-soft text-accent' : 'bg-surface-sunken text-ink-mute',
            )}
          >
            {dirty ? <LuCircleAlert className="h-3.5 w-3.5" /> : <LuCircleCheck className="h-3.5 w-3.5" />}
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
        }
      />

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        {/* main column */}
        <div className="space-y-4">
          <Section icon={<LuStore className="h-4 w-4" />} title="Store identity" subtitle="Shown in the header, footer and browser tab.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store name" required>
                {(id) => <Input id={id} required value={form.storeName} onChange={set('storeName')} />}
              </Field>
              <Field label="Tagline" hint="A short line under the store name">
                {(id) => <Input id={id} value={form.tagline} onChange={set('tagline')} />}
              </Field>
            </div>
          </Section>

          <Section icon={<LuMail className="h-4 w-4" />} title="Contact details" subtitle="Where customers reach you. Shown on the About page and footer.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact email">
                {(id) => (
                  <Affix icon={<LuMail className="h-4 w-4" />}>
                    <Input id={id} type="email" value={form.contactEmail} onChange={set('contactEmail')} className="pl-10!" />
                  </Affix>
                )}
              </Field>
              <Field label="Phone">
                {(id) => (
                  <Affix icon={<LuPhone className="h-4 w-4" />}>
                    <Input id={id} type="tel" value={form.contactPhone} onChange={set('contactPhone')} className="pl-10!" placeholder="+880 1712 345678" />
                  </Affix>
                )}
              </Field>
              <Field label="Address" className="sm:col-span-2">
                {(id) => (
                  <Affix icon={<LuMapPin className="h-4 w-4" />}>
                    <Input id={id} value={form.contactAddress} onChange={set('contactAddress')} className="pl-10!" placeholder="House, road, area · Dhaka" />
                  </Affix>
                )}
              </Field>
            </div>
          </Section>

          <Section icon={<LuTruck className="h-4 w-4" />} title="Shipping" subtitle="Each shop ships its own parcel, so these apply per shop.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Flat shipping rate" hint="Charged per shop basket">
                {(id) => (
                  <Affix prefix="৳">
                    <Input id={id} type="number" step="0.01" min="0" value={form.shippingFlatRate} onChange={set('shippingFlatRate')} className="pl-8!" />
                  </Affix>
                )}
              </Field>
              <Field label="Free shipping threshold" hint="A shop basket at or above this ships free">
                {(id) => (
                  <Affix prefix="৳">
                    <Input id={id} type="number" step="1" min="0" value={form.freeShippingThreshold} onChange={set('freeShippingThreshold')} className="pl-8!" />
                  </Affix>
                )}
              </Field>
            </div>
          </Section>

          <Section icon={<LuPercent className="h-4 w-4" />} title="Tax and commission">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tax rate" hint="Added to every order at checkout">
                {(id) => (
                  <Affix suffix="%">
                    <Input id={id} type="number" step="0.01" min="0" max="100" value={form.taxPct} onChange={set('taxPct')} className="pr-9!" />
                  </Affix>
                )}
              </Field>
              <Field label="Commission rate" hint={`${form.storeName || 'The store'}’s cut of each vendor sale`}>
                {(id) => (
                  <Affix suffix="%">
                    <Input id={id} type="number" step="0.01" min="0" max="100" value={form.commissionPct} onChange={set('commissionPct')} className="pr-9!" />
                  </Affix>
                )}
              </Field>
            </div>
          </Section>

          <Section icon={<LuPackage className="h-4 w-4" />} title="Inventory">
            <Field
              label="Low-stock threshold"
              hint="Products at or below this on-hand count are flagged Low, unless they set their own reorder point."
              className="sm:max-w-xs"
            >
              {(id) => (
                <Affix suffix="units">
                  <Input id={id} type="number" step="1" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} className="pr-14!" />
                </Affix>
              )}
            </Field>
          </Section>
        </div>

        {/* preview + save */}
        <div className="space-y-4 xl:sticky xl:top-6">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Live preview</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="bg-linear-to-br from-[#6d28d9] to-[#a78bfa] px-4 py-5 text-white">
                <p className="truncate font-display text-xl font-bold tracking-[-0.02em]">{form.storeName || 'Store name'}</p>
                <p className="mt-0.5 line-clamp-2 text-caption text-white/80">{form.tagline || 'Your tagline appears here.'}</p>
              </div>
              <ul className="space-y-2 p-4 text-caption text-ink-soft">
                <PreviewRow icon={<LuMail className="h-3.5 w-3.5" />} value={form.contactEmail} empty="No email set" />
                <PreviewRow icon={<LuPhone className="h-3.5 w-3.5" />} value={form.contactPhone} empty="No phone set" />
                <PreviewRow icon={<LuMapPin className="h-3.5 w-3.5" />} value={form.contactAddress} empty="No address set" />
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <LuReceipt className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold text-ink">Example order</p>
            </div>
            <p className="mb-3 text-caption text-ink-mute">One shop basket of {formatPrice(SAMPLE_SUBTOTAL)} with your current rates.</p>
            <dl className="space-y-1.5 text-sm">
              <Line label="Subtotal" value={formatPrice(SAMPLE_SUBTOTAL)} />
              <Line label="Shipping" value={example.shipping === 0 ? 'Free' : formatPrice(example.shipping)} />
              <Line label={`Tax (${form.taxPct}%)`} value={formatPrice(example.tax)} />
              <Line label="Customer pays" value={formatPrice(example.total)} strong />
            </dl>
            <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              <Line label={`Commission (${form.commissionPct}%)`} value={formatPrice(commission)} />
              <Line label="Vendor receives" value={formatPrice(payout)} strong />
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-caption text-ink-mute">{dirty ? 'You have unsaved changes.' : 'Everything is saved.'}</p>
            <Button type="submit" fullWidth className="mt-3" disabled={!dirty}>
              Save settings
            </Button>
            <Button type="button" variant="ghost" size="sm" fullWidth className="mt-2" disabled={!dirty} onClick={reset}>
              <LuRotateCcw className="h-3.5 w-3.5" />
              Discard changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  children: ReactNode
}) {
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

/** Wraps an input with a leading icon, a leading text prefix, or a trailing suffix. */
function Affix({
  icon,
  prefix,
  suffix,
  children,
}: {
  icon?: ReactNode
  prefix?: string
  suffix?: string
  children: ReactNode
}) {
  return (
    <div className="relative">
      {(icon || prefix) && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-mute">
          {icon ?? prefix}
        </span>
      )}
      {children}
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-mute">{suffix}</span>
      )}
    </div>
  )
}

function PreviewRow({ icon, value, empty }: { icon: ReactNode; value: string; empty: string }) {
  return (
    <li className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-accent">{icon}</span>
      <span className={cn('truncate', !value && 'italic text-ink-mute')}>{value || empty}</span>
    </li>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? 'font-semibold text-ink' : 'text-ink-mute'}>{label}</dt>
      <dd className={cn('tabular-nums', strong ? 'font-semibold text-ink' : 'text-ink-soft')}>{value}</dd>
    </div>
  )
}
