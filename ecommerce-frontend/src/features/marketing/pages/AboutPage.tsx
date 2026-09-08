import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import {
  Accordion,
  Button,
  ButtonLink,
  Container,
  Section,
  SectionHeading,
} from '@/shared/ui'
import { CheckIcon, ArrowRightIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { fadeUp, revealOnScroll } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'
import { useSettings } from '@/features/admin/context/SettingsContext'

const standards = [
  ['Named makers', 'Every product is attributed to one workshop. No white-label, no drop-ship.'],
  ['Material honesty', 'Listings state the real material and its origin — “solid oak”, not “oak finish”.'],
  ['Repairability', 'We favour pieces that can be taken apart and fixed. Makers tell us how.'],
  ['Fair settlement', 'Studios set their own prices. We take a flat commission and pay out weekly.'],
]

const faqs = [
  { id: 'f1', question: 'Why did my order arrive in separate parcels?', answer: 'Each maker ships their own work directly, so an order from three studios arrives as three parcels — often on different days.' },
  { id: 'f2', question: 'How does shipping cost work?', answer: 'Shipping is calculated per studio. Cross a studio’s free-shipping threshold and their portion ships free; the rest is a flat rate.' },
  { id: 'f3', question: 'Can I return part of an order?', answer: 'Yes. Returns are handled per shipment against that maker’s policy, shown on every product page.' },
  { id: 'f4', question: 'I make things — can I sell here?', answer: 'We review new studios on a rolling basis. Apply through “Sell on MorerDokan” and we’ll be in touch within a week.' },
]

function LineField({
  label,
  required,
  type = 'text',
  autoComplete,
  placeholder,
  textarea,
}: {
  label: string
  required?: boolean
  type?: string
  autoComplete?: string
  placeholder?: string
  textarea?: boolean
}) {
  const id = `contact-${label.toLowerCase()}`
  const shared =
    'peer w-full border-0 border-b border-border-strong bg-transparent px-0 pb-2 pt-1 text-sm text-ink outline-none placeholder:text-ink-mute/50'
  return (
    <label htmlFor={id} className="block">
      <span className="block text-caption uppercase tracking-[0.14em] text-ink-mute">{label}</span>
      <span className="relative mt-1 block">
        {textarea ? (
          <textarea
            id={id}
            name={id}
            required={required}
            rows={4}
            placeholder={placeholder}
            className={cn(shared, 'resize-none leading-relaxed')}
          />
        ) : (
          <input
            id={id}
            name={id}
            type={type}
            required={required}
            autoComplete={autoComplete}
            placeholder={placeholder}
            className={shared}
          />
        )}
        <span className="pointer-events-none absolute -bottom-px left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-[var(--dur-2)] ease-[var(--ease-editorial)] peer-focus:scale-x-100" />
      </span>
    </label>
  )
}

export function AboutPage() {
  useDocumentTitle('About · MorerDokan')
  const { settings } = useSettings()
  const [sent, setSent] = useState(false)
  const [topic, setTopic] = useState('order')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <Section className="border-b border-border">
        <Container size="narrow" className="text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-caption font-medium uppercase tracking-[0.16em] text-accent">Our story</p>
            <h1 className="mt-4 text-3xl text-ink text-balance md:text-display">
              A shop window for workshops that don’t have one
            </h1>
            <p className="mt-5 text-base text-ink-soft">
              MorerDokan began in 2021 as a shared stall at a design market. The makers kept asking the
              same thing — could we keep the table running year round, online, without turning their
              work into anonymous inventory. This is that table.
            </p>
          </motion.div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <img
              src={imageFor('Studio', 'about-studio', { w: 1000, h: 1100 })}
              alt="A shared studio space"
              className="aspect-[5/4] w-full rounded-lg object-cover"
            />
            <div>
              <SectionHeading eyebrow="How we choose" title="Four things we check before a studio joins" />
              <dl className="mt-8 space-y-6">
                {standards.map(([term, desc]) => (
                  <div key={term} className="border-l-2 border-accent pl-4">
                    <dt className="text-sm font-medium text-ink">{term}</dt>
                    <dd className="mt-1 text-sm text-ink-soft">{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden border-y border-border">
        {/* rotated edge label */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[0.65rem] uppercase tracking-[0.3em] text-ink-mute 2xl:block"
        >
          — Write to us —
        </span>
        {/* oversized faint mark */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 top-4 select-none font-serif text-[13rem] leading-none text-border-strong/25 sm:text-[18rem]"
        >
          *
        </span>

        <Container>
          <motion.div
            variants={fadeUp}
            {...revealOnScroll}
            className="relative grid grid-cols-1 gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20"
          >
            {/* left — editorial contact card */}
            <div className="lg:pt-4">
              <p className="text-caption font-medium uppercase tracking-[0.2em] text-accent">Contact</p>
              <h2 className="mt-4 font-serif text-4xl leading-[1.04] text-ink sm:text-5xl">
                Say hello,
                <span className="mt-1 block font-light italic text-ink-mute">we read everything.</span>
              </h2>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
                Order questions, feedback, or a studio we should carry. For piece-specific help the
                maker is often faster — their contact is on every product page.
              </p>

              <dl className="mt-9 border-t border-ink">
                {[
                  { label: 'Email', value: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
                  { label: 'Phone', value: settings.contactPhone, href: `tel:${settings.contactPhone.replace(/[^+\d]/g, '')}` },
                  { label: 'Studio', value: settings.contactAddress },
                ].map((row) => {
                  const Row = row.href ? 'a' : 'div'
                  return (
                    <Row
                      key={row.label}
                      {...(row.href ? { href: row.href } : {})}
                      className={cn(
                        'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-3.5 transition-colors',
                        row.href && 'group hover:border-ink',
                      )}
                    >
                      <dt className="text-caption uppercase tracking-[0.14em] text-ink-mute">{row.label}</dt>
                      <dd className={cn('text-sm text-ink', row.href && 'group-hover:text-accent')}>{row.value}</dd>
                    </Row>
                  )
                })}
              </dl>

              <p className="mt-5 flex items-center gap-2.5 text-caption text-ink-mute">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Replies within one business day
              </p>
            </div>

            {/* right — form */}
            <div className="relative">
              {sent ? (
                <div className="flex min-h-full flex-col items-start justify-center rounded-lg border border-border bg-surface p-10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
                    <CheckIcon className="h-6 w-6" />
                  </span>
                  <p className="mt-4 font-serif text-xl text-ink">Message sent</p>
                  <p className="mt-2 max-w-xs text-sm text-ink-soft">
                    Thanks for reaching out — we’ll be in touch shortly.
                  </p>
                  <ButtonLink to="/shop" variant="secondary" className="mt-6">
                    Back to shopping
                  </ButtonLink>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-8">
                  <div>
                    <p className="text-caption font-medium tracking-wide text-ink-soft">What’s this about?</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {[
                        { v: 'order', label: 'An order' },
                        { v: 'product', label: 'A product' },
                        { v: 'selling', label: 'Selling on MorerDokan' },
                        { v: 'press', label: 'Press' },
                        { v: 'other', label: 'Something else' },
                      ].map((t) => (
                        <button
                          key={t.v}
                          type="button"
                          onClick={() => setTopic(t.v)}
                          aria-pressed={topic === t.v}
                          className={cn(
                            'rounded-full border px-3.5 py-1.5 text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                            topic === t.v
                              ? 'border-transparent bg-ink text-bg'
                              : 'border-border-strong text-ink-soft hover:border-ink hover:text-ink',
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2">
                    <LineField label="Name" required autoComplete="name" placeholder="Your name" />
                    <LineField label="Email" required type="email" autoComplete="email" placeholder="you@example.com" />
                  </div>
                  <LineField label="Message" required textarea placeholder="How can we help?" />

                  <Button type="submit" size="lg">
                    Send message
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </Container>
      </Section>

      <Section>
        <Container size="narrow">
          <SectionHeading eyebrow="FAQ" title="Common questions" align="center" />
          <Accordion className="mt-8" items={faqs} defaultOpen="f1" />
        </Container>
      </Section>

      <Section size="sm">
        <Container>
          <motion.div
            variants={fadeUp}
            {...revealOnScroll}
            className="flex flex-col items-center justify-between gap-5 rounded-xl bg-ink px-8 py-10 text-center md:flex-row md:text-left"
          >
            <div>
              <h2 className="font-serif text-2xl text-bg">Make something worth keeping?</h2>
              <p className="mt-1.5 text-sm text-bg/70">Apply to open a studio on MorerDokan.</p>
            </div>
            <ButtonLink to="/vendor/signup" variant="secondary" className="shrink-0 border-transparent bg-bg">
              Sell on MorerDokan
            </ButtonLink>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
