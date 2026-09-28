import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuHash, LuMail, LuPackageSearch, LuSearch } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Badge, Container, Field, Input, PageHeader, Section } from '@/shared/ui'
import { formatDateLong, formatPrice } from '@/shared/lib/format'
import { useOrders } from '../context/OrdersContext'
import { ParcelCard } from '@/features/account/components/ParcelCard'
import { orderProgress, progressTone } from '@/features/account/lib/useCustomer'

/** Guest order lookup: order number + the email used at checkout. */
export function TrackOrderPage() {
  useDocumentTitle('Track an order · AmbalaEshop')
  const { orders } = useOrders()
  const [params, setParams] = useSearchParams()
  const [number, setNumber] = useState(params.get('order') ?? '')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [searched, setSearched] = useState(Boolean(params.get('order')))

  const query = { order: params.get('order') ?? '', email: params.get('email') ?? '' }
  // both must match so strangers can't look up someone else's order
  const found = searched
    ? orders.find(
        (o) =>
          o.orderNumber.toLowerCase() === query.order.trim().toLowerCase() &&
          o.email.toLowerCase() === query.email.trim().toLowerCase(),
      )
    : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setParams({ order: number.trim(), email: email.trim() })
    setSearched(true)
  }

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        <PageHeader
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Track an order' }]}
          eyebrow="Order tracking"
          title={
            <>
              Where’s my <em>order?</em>
            </>
          }
          description="Enter the order number from your confirmation email and the email you used at checkout."
        />

        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Field label="Order number" required>
              {(id) => (
                <div className="relative">
                  <LuHash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                  <Input id={id} required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="MSN-123456" className="pl-10! uppercase" />
                </div>
              )}
            </Field>
            <Field label="Email" required>
              {(id) => (
                <div className="relative">
                  <LuMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                  <Input id={id} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10!" />
                </div>
              )}
            </Field>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              <LuSearch className="h-4 w-4" />
              Track
            </button>
          </div>
          <p className="mt-3 text-caption text-ink-mute">
            Have an account?{' '}
            <Link to="/account/orders" className="font-semibold text-accent hover:underline">
              See all your orders
            </Link>
          </p>
        </form>

        {searched && !found && (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <LuPackageSearch className="h-6 w-6" />
            </span>
            <p className="mt-4 font-display text-lg font-bold text-ink">We couldn’t find that order</p>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              Check the order number and email match your confirmation. Still stuck?{' '}
              <Link to="/contact" className="font-semibold text-accent hover:underline">
                Contact us
              </Link>
              .
            </p>
          </div>
        )}

        {found && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-display text-xl font-extrabold text-ink">
                  {found.orderNumber}
                  <Badge tone={progressTone[orderProgress(found)]}>{orderProgress(found)}</Badge>
                </p>
                <p className="text-sm text-ink-mute">
                  Placed {formatDateLong(found.date)} · {found.shipments.length} {found.shipments.length > 1 ? 'parcels' : 'parcel'}
                </p>
              </div>
              <p className="font-display text-xl font-extrabold text-ink tabular-nums">{formatPrice(found.grandTotal)}</p>
            </div>
            {found.shipments.map((s) => (
              <ParcelCard key={s.vendorId} shipment={s} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
