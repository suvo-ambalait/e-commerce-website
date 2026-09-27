import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LuBadgeCheck, LuHandCoins, LuLeaf, LuMapPin, LuPhone, LuPlus, LuWrench } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container, Section } from '@/shared/ui'
import { CheckIcon, ArrowRightIcon, MailIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { easeEditorial, fadeUp, revealOnScroll } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { DisplayHeading } from '../components/DisplayHeading'
import { SellCta } from '../components/SellCta'

const standards = [
  { icon: LuBadgeCheck, term: 'Named makers', desc: 'Every product is attributed to one workshop. No white-label, no drop-ship.' },
  { icon: LuLeaf, term: 'Material honesty', desc: 'Listings state the real material and its origin — “solid oak”, not “oak finish”.' },
  { icon: LuWrench, term: 'Repairability', desc: 'We favour pieces that can be taken apart and fixed. Makers tell us how.' },
  { icon: LuHandCoins, term: 'Fair settlement', desc: 'Shops set their own prices. We take a flat commission and pay out weekly.' },
]

const faqs = [
  { id: 'f1', question: 'Why did my order arrive in separate parcels?', answer: 'Each maker ships their own work directly, so an order from three shops arrives as three parcels — often on different days.' },
  { id: 'f2', question: 'How does shipping cost work?', answer: 'Shipping is calculated per shop. Cross a shop’s free-shipping threshold and their portion ships free; the rest is a flat rate.' },
  { id: 'f3', question: 'Can I return part of an order?', answer: 'Yes. Returns are handled per shipment against that maker’s policy, shown on every product page.' },
  { id: 'f4', question: 'I make things — can I sell here?', answer: 'We review new shops on a rolling basis. Apply through “Sell on AmbalaEshop” and we’ll be in touch within a week.' },
]

const topics = [
  { v: 'order', label: 'An order' },
  { v: 'product', label: 'A product' },
  { v: 'selling', label: 'Selling on AmbalaEshop' },
  { v: 'press', label: 'Press' },
  { v: 'other', label: 'Something else' },
]

function BoxField({
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
    'w-full rounded-xl border border-border-strong bg-surface px-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-mute focus:border-accent! focus:ring-2 focus:ring-accent/20'
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-caption font-semibold text-ink-soft">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {textarea ? (
        <textarea
          id={id}
          name={id}
          required={required}
          rows={5}
          placeholder={placeholder}
          className={cn(shared, 'resize-none py-3 leading-relaxed')}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(shared, 'h-12')}
        />
      )}
    </label>
  )
}

export function AboutPage() {
  useDocumentTitle('About · AmbalaEshop')
  const { settings } = useSettings()
  const { activeVendors } = useVendors()
  const { products } = useCatalog()
  const [sent, setSent] = useState(false)
  const [topic, setTopic] = useState('order')
  const [openFaq, setOpenFaq] = useState<string | null>('f1')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const contacts = [
    { icon: MailIcon, label: 'Email', value: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
    { icon: LuPhone, label: 'Phone', value: settings.contactPhone, href: `tel:${settings.contactPhone.replace(/[^+\d]/g, '')}` },
    { icon: LuMapPin, label: 'Address', value: settings.contactAddress },
  ]

  return (
    <>
      {/* hero */}
      <Section className="relative overflow-hidden bg-surface-sunken/50">
        {/* decorative rings — `!` beats the global `* { border-color }` rule in index.css */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-112 w-112 rounded-full border border-accent/15!" />
        <div className="pointer-events-none absolute -right-32 bottom-[-12rem] h-112 w-112 rounded-full border border-accent/15!" />

        <Container size="narrow" className="relative text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/20! bg-accent-soft py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-ink-soft">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-on-accent">Since 2021</span>
              Our story
            </p>
            {/* `!` beats the global unlayered h1 font rule in index.css */}
            <h1 className="mt-6 font-display! text-[clamp(2.5rem,1.6rem+3.8vw,4.75rem)] font-extrabold! leading-[0.98] tracking-[-0.045em]! text-ink text-balance">
              A shop window for workshops <em className="font-medium text-accent">that don’t have one.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
              AmbalaEshop began in 2021 as a shared stall at a design market. The makers kept asking the same thing —
              could we keep the table running year round, online, without turning their work into anonymous
              inventory. This is that table.
            </p>

            <dl className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { value: activeVendors.length, label: 'Shops' },
                { value: products.length, label: 'Pieces' },
                { value: 1, label: 'Checkout' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-surface px-3 py-4 shadow-sm">
                  <dd className="font-display text-3xl font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                    {s.value}
                  </dd>
                  <dt className="mt-1.5 text-caption text-ink-mute">{s.label}</dt>
                </div>
              ))}
            </dl>
          </motion.div>
        </Container>
      </Section>

      {/* standards */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div className="relative">
              <img
                src={imageFor('Studio', 'about-studio', { w: 1000, h: 1100 })}
                alt="A shared studio space"
                className="aspect-[5/4] w-full rounded-3xl object-cover"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-surface p-3 pr-5 shadow-[0_18px_40px_rgba(40,20,80,0.18)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <LuBadgeCheck className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">Every shop reviewed</span>
                  <span className="block text-caption text-ink-mute">Four checks before joining</span>
                </span>
              </div>
            </div>

            <div>
              <DisplayHeading
                eyebrow="How we choose"
                title={
                  <>
                    Four things we check <em>before a shop joins</em>
                  </>
                }
              />
              <dl className="mt-8 grid gap-3 sm:grid-cols-2">
                {standards.map(({ icon: Icon, term, desc }, i) => (
                  <div key={term} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="font-display text-sm font-bold text-ink-mute tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <dt className="mt-4 font-display text-base font-bold text-ink">{term}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      {/* contact */}
      <Section className="bg-surface-sunken/50">
        <Container>
          <motion.div
            variants={fadeUp}
            {...revealOnScroll}
            className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12"
          >
            <div>
              <DisplayHeading
                eyebrow="Contact"
                title={
                  <>
                    Say hello, <em>we read everything.</em>
                  </>
                }
                description="Order questions, feedback, or a shop we should carry. For piece-specific help the maker is often faster — their contact is on every product page."
              />

              <ul className="mt-8 space-y-2.5">
                {contacts.map(({ icon: Icon, label, value, href }) => {
                  const inner = (
                    <>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <Icon className="h-4.5 w-4.5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                          {label}
                        </span>
                        <span className="block truncate text-sm font-semibold text-ink">{value}</span>
                      </span>
                    </>
                  )
                  const cls =
                    'flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm transition-colors'
                  return (
                    <li key={label}>
                      {href ? (
                        <a href={href} className={cn(cls, 'hover:border-accent/50!')}>
                          {inner}
                        </a>
                      ) : (
                        <div className={cls}>{inner}</div>
                      )}
                    </li>
                  )
                })}
              </ul>

              <p className="mt-5 flex items-center gap-2.5 text-caption text-ink-mute">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Replies within one business day
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              {sent ? (
                <div className="flex h-full flex-col items-start justify-center py-10">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
                    <CheckIcon className="h-7 w-7" />
                  </span>
                  <p className="mt-5 font-display text-2xl font-bold text-ink">Message sent</p>
                  <p className="mt-2 max-w-xs text-sm text-ink-soft">
                    Thanks for reaching out — we’ll be in touch shortly.
                  </p>
                  <Link
                    to="/shop"
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-border-strong px-5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    Back to shopping
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-6">
                  <div>
                    <p className="text-caption font-semibold text-ink-soft">What’s this about?</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {topics.map((t) => (
                        <button
                          key={t.v}
                          type="button"
                          onClick={() => setTopic(t.v)}
                          aria-pressed={topic === t.v}
                          className={cn(
                            'h-9 rounded-full border px-4 text-caption font-semibold transition-colors',
                            topic === t.v
                              ? 'border-accent! bg-accent text-on-accent'
                              : 'border-border-strong text-ink-soft hover:border-accent! hover:text-accent',
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <BoxField label="Name" required autoComplete="name" placeholder="Your name" />
                    <BoxField label="Email" required type="email" autoComplete="email" placeholder="you@example.com" />
                  </div>
                  <BoxField label="Message" required textarea placeholder="How can we help?" />

                  <button
                    type="submit"
                    className="group inline-flex h-12 items-center gap-3 rounded-full bg-accent pl-6 pr-2 text-sm font-semibold text-on-accent shadow-[0_10px_28px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover"
                  >
                    Send message
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6d28d9]">
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container size="narrow">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              FAQ
            </p>
            <h2 className="mt-3 font-display! text-[clamp(2rem,1.4rem+2.6vw,3rem)] font-extrabold! leading-none tracking-[-0.04em]! text-ink">
              Common <em className="font-medium text-accent">questions</em>
            </h2>
          </div>

          <div className="mt-8 space-y-2.5">
            {faqs.map((f) => {
              const open = openFaq === f.id
              return (
                <div
                  key={f.id}
                  className={cn(
                    'rounded-2xl border bg-surface transition-colors',
                    open ? 'border-accent/40! shadow-[0_12px_30px_rgba(40,20,80,0.08)]' : 'border-border',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : f.id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink"
                  >
                    {f.question}
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                        open ? 'bg-accent text-on-accent' : 'bg-surface-sunken text-ink-soft',
                      )}
                    >
                      <LuPlus className={cn('h-4 w-4 transition-transform duration-300', open && 'rotate-45')} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: easeEditorial }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 pr-16 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      <Section size="sm" className="pt-0 md:pt-0">
        <Container>
          <SellCta />
        </Container>
      </Section>
    </>
  )
}
