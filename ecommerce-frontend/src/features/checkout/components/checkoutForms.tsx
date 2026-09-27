import type { FormEvent, ReactNode } from 'react'
import { LuCreditCard, LuLock, LuMapPin } from 'react-icons/lu'
import { Field, Input, Select } from '@/shared/ui'
import { ArrowLeftIcon, ArrowRightIcon } from '@/shared/ui/icons'
import type { PaymentInfo, ShippingInfo } from '@/shared/types'

const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia']

export const emptyShipping: ShippingInfo = {
  fullName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'United States',
  phone: '',
}

export const emptyPayment: PaymentInfo = { cardName: '', cardNumber: '', expiry: '', cvc: '' }

/** White rounded panel with an icon-square heading — the building block of the checkout steps. */
export function CheckoutPanel({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode
  title: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            {icon}
          </span>
          <h2 className="font-display! text-lg font-bold! tracking-[-0.01em]! text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Purple pill submit with a white arrow circle, matching the cart's "Secure checkout". */
export function PrimaryPill({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <button
      type="submit"
      className="group inline-flex h-13 items-center gap-3 rounded-full bg-accent pl-6 pr-1.5 text-sm font-semibold text-on-accent shadow-[0_10px_28px_rgba(109,40,217,0.35)] transition-colors hover:bg-accent-hover"
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6d28d9]">
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

export function BackPill({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-13 items-center gap-2 rounded-full border border-border-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      {children}
    </button>
  )
}

export function ShippingForm({
  value,
  onChange,
  onSubmit,
  onBack,
}: {
  value: ShippingInfo
  onChange: (next: ShippingInfo) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const set = (key: keyof ShippingInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <CheckoutPanel icon={<LuMapPin className="h-4 w-4" />} title="Shipping address">
        <div className="grid gap-4">
          <Field label="Full name" required>
            {(id) => <Input id={id} required value={value.fullName} onChange={set('fullName')} autoComplete="name" />}
          </Field>
          <Field label="Address" required>
            {(id) => (
              <Input id={id} required value={value.address} onChange={set('address')} autoComplete="street-address" />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" required>
              {(id) => <Input id={id} required value={value.city} onChange={set('city')} />}
            </Field>
            <Field label="State / Region" required>
              {(id) => <Input id={id} required value={value.state} onChange={set('state')} />}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ZIP / Postcode" required>
              {(id) => <Input id={id} required value={value.zip} onChange={set('zip')} />}
            </Field>
            <Field label="Country" required>
              {(id) => (
                <Select
                  id={id}
                  value={value.country}
                  onChange={(v) => onChange({ ...value, country: v })}
                  options={countries.map((c) => ({ value: c, label: c }))}
                />
              )}
            </Field>
          </div>
          <Field label="Phone" required hint="For delivery updates only">
            {(id) => (
              <Input id={id} required type="tel" value={value.phone} onChange={set('phone')} autoComplete="tel" />
            )}
          </Field>
        </div>
      </CheckoutPanel>

      <div className="flex flex-wrap items-center gap-3">
        <BackPill onClick={onBack}>Back to cart</BackPill>
        <PrimaryPill>Continue to payment</PrimaryPill>
      </div>
    </form>
  )
}

export function PaymentForm({
  value,
  onChange,
  onSubmit,
  onBack,
  submitLabel,
  before,
}: {
  value: PaymentInfo
  onChange: (next: PaymentInfo) => void
  onSubmit: () => void
  onBack: () => void
  submitLabel: ReactNode
  /** panels shown above the card form (address recap, parcels) */
  before?: ReactNode
}) {
  const set = (key: keyof PaymentInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {before}

      <CheckoutPanel icon={<LuCreditCard className="h-4 w-4" />} title="Card details">
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-accent-soft/70 px-3.5 py-2.5 text-caption text-ink-soft">
          <LuLock className="h-3.5 w-3.5 shrink-0 text-accent" />
          Demo checkout — no card is charged. Any values are accepted.
        </p>
        <div className="grid gap-4">
          <Field label="Name on card" required>
            {(id) => <Input id={id} required value={value.cardName} onChange={set('cardName')} autoComplete="cc-name" />}
          </Field>
          <Field label="Card number" required>
            {(id) => (
              <Input
                id={id}
                required
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={value.cardNumber}
                onChange={set('cardNumber')}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expiry" required>
              {(id) => (
                <Input
                  id={id}
                  required
                  autoComplete="cc-exp"
                  placeholder="MM / YY"
                  value={value.expiry}
                  onChange={set('expiry')}
                />
              )}
            </Field>
            <Field label="CVC" required>
              {(id) => (
                <Input
                  id={id}
                  required
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={value.cvc}
                  onChange={set('cvc')}
                />
              )}
            </Field>
          </div>
        </div>
      </CheckoutPanel>

      <div className="flex flex-wrap items-center gap-3">
        <BackPill onClick={onBack}>Back</BackPill>
        <PrimaryPill icon={<LuLock className="h-4 w-4" />}>{submitLabel}</PrimaryPill>
      </div>
    </form>
  )
}
