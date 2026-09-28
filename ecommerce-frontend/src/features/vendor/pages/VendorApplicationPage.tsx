import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LuCheck, LuClock, LuMail, LuMapPin, LuPhone, LuSearch, LuStore, LuX } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container, Field, Input, PageHeader, Section } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatDateLong } from '@/shared/lib/format'
import type { Vendor } from '@/shared/types'
import { useVendors } from '../context/VendorContext'
import { readApplication, rememberApplication } from '../lib/application'

/** Where a new seller lands after applying: shows review progress and what to do next. */
export function VendorApplicationPage() {
  useDocumentTitle('Your application · AmbalaEshop')
  const { vendors } = useVendors()
  const [appliedId, setAppliedId] = useState(readApplication)
  const vendor = vendors.find((v) => v.id === appliedId)

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        <PageHeader
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Sell on AmbalaEshop', to: '/vendor/signup' }, { label: 'Application status' }]}
          eyebrow="Seller application"
          title={
            vendor ? (
              <>
                {vendor.status === 'active' ? 'You’re ' : 'Thanks, '}
                <em>{vendor.status === 'active' ? 'approved' : vendor.name}</em>
              </>
            ) : (
              <>
                Check your <em>application</em>
              </>
            )
          }
          description={
            vendor
              ? statusCopy(vendor).description
              : 'Enter the shop email you applied with to see where your application is.'
          }
        />

        <div className="mt-8">
          {vendor ? (
            <StatusView vendor={vendor} />
          ) : (
            <Lookup
              onFound={(id) => {
                rememberApplication(id)
                setAppliedId(id)
              }}
            />
          )}
        </div>
      </Container>
    </Section>
  )
}

function statusCopy(v: Vendor) {
  if (v.status === 'active')
    return { description: 'Your shop is live. Customers can find and buy from it now.', tone: 'success' as const }
  if (v.status === 'suspended')
    return {
      description: 'We couldn’t approve your shop this time. See the note below for what to do next.',
      tone: 'danger' as const,
    }
  return {
    description: 'We’ve received your application. A curator usually reviews it within a week, and we’ll email you either way.',
    tone: 'warning' as const,
  }
}

function StatusView({ vendor }: { vendor: Vendor }) {
  const rejected = vendor.status === 'suspended'
  const steps = [
    { title: 'Application sent', text: formatDateLong(vendor.joinedAt), done: true },
    {
      title: 'Curator review',
      text: vendor.status === 'pending' ? 'In progress — usually within a week' : 'Done',
      done: vendor.status !== 'pending',
      current: vendor.status === 'pending',
    },
    {
      title: rejected ? 'Not approved' : 'Shop goes live',
      text: vendor.status === 'active' ? 'Your storefront is public' : rejected ? 'Contact us to talk it through' : 'After approval',
      done: vendor.status === 'active',
      failed: rejected,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <div className="space-y-5">
        {/* progress */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 font-display! text-lg font-bold! tracking-[-0.01em]! text-ink">Progress</h2>
          <ol className="space-y-0">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                {i < steps.length - 1 && (
                  <span className={cn('absolute left-4 top-9 h-[calc(100%-2.25rem)] w-0.5 -translate-x-1/2', s.done ? 'bg-accent' : 'bg-border')} aria-hidden />
                )}
                <span
                  className={cn(
                    'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    s.failed
                      ? 'bg-danger text-white'
                      : s.done
                        ? 'bg-accent text-on-accent'
                        : s.current
                          ? 'bg-warning-soft text-warning ring-4 ring-warning/15'
                          : 'bg-surface-sunken text-ink-mute',
                  )}
                >
                  {s.failed ? <LuX className="h-4 w-4" /> : s.done ? <LuCheck className="h-4 w-4" /> : s.current ? <LuClock className="h-4 w-4" /> : i + 1}
                </span>
                <div className="pt-1">
                  <p className="text-sm font-semibold text-ink">{s.title}</p>
                  <p className="text-caption text-ink-mute">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* next steps */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 font-display! text-lg font-bold! tracking-[-0.01em]! text-ink">What to do next</h2>
          {vendor.status === 'active' && (
            <p className="text-sm text-ink-soft">Add your products, set how you want to be paid, and choose where you deliver.</p>
          )}
          {vendor.status === 'pending' && (
            <p className="text-sm text-ink-soft">
              You don’t have to wait. Set up your storefront, add products and add your payout details now. Everything goes live the
              moment you’re approved.
            </p>
          )}
          {rejected && (
            <p className="text-sm text-ink-soft">
              This is usually about product photos, materials or missing details. Contact us and we’ll tell you what to change before
              you apply again.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {rejected ? (
              <Link to="/contact" className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">
                Contact us
              </Link>
            ) : (
              <>
                <Link
                  to="/vendor/dashboard"
                  className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
                >
                  Go to your dashboard
                </Link>
                <Link
                  to="/vendor/dashboard/payouts"
                  className="inline-flex h-11 items-center rounded-full border border-border-strong bg-surface px-5 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
                >
                  Add payout details
                </Link>
              </>
            )}
          </div>
        </section>
      </div>

      {/* what was submitted */}
      <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-28">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Your application</p>
        <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <LuStore className="h-4.5 w-4.5 text-accent" />
          {vendor.name}
        </p>
        <p className="mt-1 text-sm text-ink-soft">{vendor.tagline}</p>
        <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm text-ink-soft">
          <li className="flex items-center gap-2">
            <LuMail className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate">{vendor.ownerEmail}</span>
          </li>
          {vendor.ownerPhone && (
            <li className="flex items-center gap-2">
              <LuPhone className="h-4 w-4 shrink-0 text-accent" />
              {vendor.ownerPhone}
            </li>
          )}
          <li className="flex items-center gap-2">
            <LuMapPin className="h-4 w-4 shrink-0 text-accent" />
            {vendor.location}
          </li>
        </ul>
        <p className="mt-4 line-clamp-4 text-caption leading-relaxed text-ink-mute">{vendor.bio}</p>
      </aside>
    </div>
  )
}

function Lookup({ onFound }: { onFound: (vendorId: string) => void }) {
  const { vendors } = useVendors()
  const [email, setEmail] = useState('')
  const [missing, setMissing] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = vendors.find((x) => x.ownerEmail.toLowerCase() === email.trim().toLowerCase())
    if (v) onFound(v.id)
    else setMissing(true)
  }

  return (
    <form onSubmit={submit} className="max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <Field label="Shop email" required error={missing ? 'We couldn’t find an application with that email.' : undefined}>
        {(id) => (
          <Input
            id={id}
            required
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setMissing(false)
            }}
            placeholder="shop@example.com"
          />
        )}
      </Field>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">
          <LuSearch className="h-4 w-4" />
          Check status
        </button>
        <Link to="/vendor/signup" className="text-sm font-semibold text-accent hover:underline">
          Or apply to sell
        </Link>
      </div>
    </form>
  )
}
