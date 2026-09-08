import type { FormEvent } from 'react'
import { Button, Field, Input, Select } from '@/shared/ui'
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

export function ShippingForm({
  value,
  onChange,
  onSubmit,
}: {
  value: ShippingInfo
  onChange: (next: ShippingInfo) => void
  onSubmit: () => void
}) {
  const set = (key: keyof ShippingInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Full name" required>
        {(id) => <Input id={id} required value={value.fullName} onChange={set('fullName')} autoComplete="name" />}
      </Field>
      <Field label="Address" required>
        {(id) => <Input id={id} required value={value.address} onChange={set('address')} autoComplete="street-address" />}
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
        {(id) => <Input id={id} required type="tel" value={value.phone} onChange={set('phone')} autoComplete="tel" />}
      </Field>
      <Button type="submit" size="lg" className="mt-2 justify-self-start">
        Continue to payment
      </Button>
    </form>
  )
}

export function PaymentForm({
  value,
  onChange,
  onSubmit,
  onBack,
}: {
  value: PaymentInfo
  onChange: (next: PaymentInfo) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const set = (key: keyof PaymentInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <p className="rounded-sm bg-surface-sunken px-3 py-2 text-caption text-ink-mute">
        Demo checkout — no card is charged. Any values are accepted.
      </p>
      <Field label="Name on card" required>
        {(id) => <Input id={id} required value={value.cardName} onChange={set('cardName')} />}
      </Field>
      <Field label="Card number" required>
        {(id) => (
          <Input id={id} required inputMode="numeric" placeholder="4242 4242 4242 4242" value={value.cardNumber} onChange={set('cardNumber')} />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Expiry" required>
          {(id) => <Input id={id} required placeholder="MM / YY" value={value.expiry} onChange={set('expiry')} />}
        </Field>
        <Field label="CVC" required>
          {(id) => <Input id={id} required placeholder="123" value={value.cvc} onChange={set('cvc')} />}
        </Field>
      </div>
      <div className="mt-2 flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="lg">
          Review order
        </Button>
      </div>
    </form>
  )
}
