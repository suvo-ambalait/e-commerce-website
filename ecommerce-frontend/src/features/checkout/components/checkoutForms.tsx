import type { FormEvent, ReactNode } from 'react'
import { LuBanknote, LuCreditCard, LuLock, LuMail, LuMapPin, LuSmartphone, LuTruck, LuWallet } from 'react-icons/lu'
import { Field, Input, Select } from '@/shared/ui'
import { ArrowLeftIcon, ArrowRightIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import type { PaymentInfo, PaymentMethod, ShippingInfo } from '@/shared/types'
import type { DeliveryZone, SavedAddress } from '@/features/marketplace/stores'

const countries = ['Bangladesh']

export const emptyShipping: ShippingInfo = {
  fullName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'Bangladesh',
  phone: '',
}

export const emptyPayment: PaymentInfo = { cardName: '', cardNumber: '', expiry: '', cvc: '' }

export interface WalletInfo {
  number: string
  transactionId: string
}

export const emptyWallet: WalletInfo = { number: '', transactionId: '' }

export const paymentMethods: { value: PaymentMethod; label: string; hint: string; icon: typeof LuBanknote }[] = [
  { value: 'cod', label: 'Cash on delivery', hint: 'Pay in cash when your parcel arrives', icon: LuBanknote },
  { value: 'bkash', label: 'bKash', hint: 'Send money, then enter the transaction ID', icon: LuSmartphone },
  { value: 'nagad', label: 'Nagad', hint: 'Send money, then enter the transaction ID', icon: LuWallet },
  { value: 'card', label: 'Debit / credit card', hint: 'Visa, Mastercard, Amex', icon: LuCreditCard },
]

export const paymentLabel: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
  card: 'Card',
}

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

/** Large selectable card used for delivery areas and payment methods. */
function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  hint,
  aside,
  disabled,
}: {
  selected: boolean
  onSelect: () => void
  icon: ReactNode
  title: string
  hint: string
  aside?: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-45',
        selected ? 'border-accent! bg-accent-soft/60 ring-4 ring-accent/10' : 'border-border-strong hover:border-accent/50!',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          selected ? 'bg-accent text-on-accent' : 'bg-surface-sunken text-ink-soft',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-caption text-ink-mute">{hint}</span>
      </span>
      {aside}
    </button>
  )
}

export function ShippingForm({
  value,
  onChange,
  email,
  onEmailChange,
  zones,
  zoneId,
  onZoneChange,
  savedAddresses = [],
  onSubmit,
  onBack,
}: {
  value: ShippingInfo
  onChange: (next: ShippingInfo) => void
  email: string
  onEmailChange: (email: string) => void
  zones: DeliveryZone[]
  zoneId: string
  onZoneChange: (id: string) => void
  savedAddresses?: SavedAddress[]
  onSubmit: () => void
  onBack: () => void
}) {
  const set = (key: keyof ShippingInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const applySaved = (a: SavedAddress) =>
    onChange({ fullName: a.fullName, address: a.address, city: a.city, state: a.area, zip: a.zip, country: a.country, phone: a.phone })

  return (
    <form onSubmit={submit} className="space-y-5">
      <CheckoutPanel icon={<LuMapPin className="h-4 w-4" />} title="Delivery address">
        {savedAddresses.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-caption font-semibold text-ink-mute">Use a saved address</p>
            <div className="flex flex-wrap gap-2">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => applySaved(a)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-3.5 text-caption font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  <LuMapPin className="h-3.5 w-3.5" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              {(id) => <Input id={id} required value={value.fullName} onChange={set('fullName')} autoComplete="name" />}
            </Field>
            <Field label="Phone" required hint="The delivery person will call this number">
              {(id) => (
                <Input id={id} required type="tel" value={value.phone} onChange={set('phone')} autoComplete="tel" placeholder="+880 1712 345678" />
              )}
            </Field>
          </div>
          <Field label="Email" required hint="We send your order confirmation and tracking here">
            {(id) => (
              <div className="relative">
                <LuMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                <Input id={id} required type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} autoComplete="email" className="pl-10!" />
              </div>
            )}
          </Field>
          <Field label="Address" required hint="House, road, block">
            {(id) => (
              <Input id={id} required value={value.address} onChange={set('address')} autoComplete="street-address" placeholder="House 12, Road 5, Block C" />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area / Thana" required>
              {(id) => <Input id={id} required value={value.state} onChange={set('state')} placeholder="Dhanmondi" />}
            </Field>
            <Field label="City / District" required>
              {(id) => <Input id={id} required value={value.city} onChange={set('city')} placeholder="Dhaka" />}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Postcode">
              {(id) => <Input id={id} value={value.zip} onChange={set('zip')} inputMode="numeric" placeholder="1209" />}
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
        </div>
      </CheckoutPanel>

      <CheckoutPanel icon={<LuTruck className="h-4 w-4" />} title="Delivery area">
        <div role="radiogroup" aria-label="Delivery area" className="grid gap-2.5">
          {zones.map((z) => (
            <ChoiceCard
              key={z.id}
              selected={z.id === zoneId}
              onSelect={() => onZoneChange(z.id)}
              icon={<LuTruck className="h-4 w-4" />}
              title={z.name}
              hint={`${z.areas} · ${z.minDays}–${z.maxDays} days`}
              aside={
                <span className="text-right">
                  <span className="block text-sm font-bold text-ink tabular-nums">{formatPrice(z.rate)}</span>
                  {z.freeOver > 0 && <span className="block text-[11px] text-ink-mute">Free over {formatPrice(z.freeOver)}</span>}
                </span>
              }
            />
          ))}
        </div>
        <p className="mt-3 text-caption text-ink-mute">The charge applies to each shop’s parcel.</p>
      </CheckoutPanel>

      <div className="flex flex-wrap items-center gap-3">
        <BackPill onClick={onBack}>Back to cart</BackPill>
        <PrimaryPill>Continue to payment</PrimaryPill>
      </div>
    </form>
  )
}

export function PaymentForm({
  method,
  onMethodChange,
  card,
  onCardChange,
  wallet,
  onWalletChange,
  codAvailable,
  total,
  onSubmit,
  onBack,
  before,
}: {
  method: PaymentMethod
  onMethodChange: (m: PaymentMethod) => void
  card: PaymentInfo
  onCardChange: (next: PaymentInfo) => void
  wallet: WalletInfo
  onWalletChange: (next: WalletInfo) => void
  codAvailable: boolean
  total: number
  onSubmit: () => void
  onBack: () => void
  /** panels shown above the payment options (address recap, parcels) */
  before?: ReactNode
}) {
  const setCard = (key: keyof PaymentInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onCardChange({ ...card, [key]: e.target.value })
  const setWallet = (key: keyof WalletInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onWalletChange({ ...wallet, [key]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const isWallet = method === 'bkash' || method === 'nagad'
  const submitLabel = method === 'cod' ? `Place order · ${formatPrice(total)}` : `Pay ${formatPrice(total)}`

  return (
    <form onSubmit={submit} className="space-y-5">
      {before}

      <CheckoutPanel icon={<LuWallet className="h-4 w-4" />} title="Payment method">
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-accent-soft/70 px-3.5 py-2.5 text-caption text-ink-soft">
          <LuLock className="h-3.5 w-3.5 shrink-0 text-accent" />
          Demo checkout — no money is taken. Any values are accepted.
        </p>

        <div role="radiogroup" aria-label="Payment method" className="grid gap-2.5 sm:grid-cols-2">
          {paymentMethods.map((m) => (
            <ChoiceCard
              key={m.value}
              selected={method === m.value}
              onSelect={() => onMethodChange(m.value)}
              icon={<m.icon className="h-4 w-4" />}
              title={m.label}
              hint={m.value === 'cod' && !codAvailable ? 'Not available in your delivery area' : m.hint}
              disabled={m.value === 'cod' && !codAvailable}
            />
          ))}
        </div>

        {method === 'cod' && (
          <p className="mt-4 rounded-xl border border-border bg-surface-sunken/60 px-4 py-3 text-sm text-ink-soft">
            Pay in cash to the delivery person when each parcel arrives. Please keep the exact amount ready.
          </p>
        )}

        {isWallet && (
          <div className="mt-4 rounded-xl border border-border bg-surface-sunken/60 p-4">
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
              <li>
                Open your {method === 'bkash' ? 'bKash' : 'Nagad'} app and choose <strong className="text-ink">Send Money</strong>.
              </li>
              <li>
                Send <strong className="text-ink">{formatPrice(total)}</strong> to our merchant number.
              </li>
              <li>Enter your wallet number and the transaction ID below.</li>
            </ol>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your wallet number" required>
                {(id) => (
                  <Input id={id} required type="tel" inputMode="numeric" placeholder="01XXXXXXXXX" value={wallet.number} onChange={setWallet('number')} />
                )}
              </Field>
              <Field label="Transaction ID" required>
                {(id) => <Input id={id} required placeholder="e.g. 9BG7XK2LQ1" value={wallet.transactionId} onChange={setWallet('transactionId')} />}
              </Field>
            </div>
          </div>
        )}

        {method === 'card' && (
          <div className="mt-4 grid gap-4">
            <Field label="Name on card" required>
              {(id) => <Input id={id} required value={card.cardName} onChange={setCard('cardName')} autoComplete="cc-name" />}
            </Field>
            <Field label="Card number" required>
              {(id) => (
                <Input
                  id={id}
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  value={card.cardNumber}
                  onChange={setCard('cardNumber')}
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Expiry" required>
                {(id) => <Input id={id} required autoComplete="cc-exp" placeholder="MM / YY" value={card.expiry} onChange={setCard('expiry')} />}
              </Field>
              <Field label="CVC" required>
                {(id) => <Input id={id} required inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cvc} onChange={setCard('cvc')} />}
              </Field>
            </div>
          </div>
        )}
      </CheckoutPanel>

      <div className="flex flex-wrap items-center gap-3">
        <BackPill onClick={onBack}>Back</BackPill>
        <PrimaryPill icon={<LuLock className="h-4 w-4" />}>{submitLabel}</PrimaryPill>
      </div>
    </form>
  )
}
