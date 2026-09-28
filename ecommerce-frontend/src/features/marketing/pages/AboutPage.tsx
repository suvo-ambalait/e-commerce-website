import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { IconType } from 'react-icons'
import {
  LuBadgeCheck,
  LuHandCoins,
  LuLeaf,
  LuMapPin,
  LuPackage,
  LuPhone,
  LuPlus,
  LuShoppingBag,
  LuStore,
  LuWrench,
} from 'react-icons/lu'
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
  { icon: LuBadgeCheck, term: 'Real shops', tag: 'Owner verified', desc: 'We check every shop’s owner, phone number and address before it can sell.' },
  { icon: LuLeaf, term: 'Honest product details', tag: 'True to photo', desc: 'Photos and descriptions must show the real product, its material and its size.' },
  { icon: LuWrench, term: 'Good quality', tag: 'Quality reviewed', desc: 'We look at the product quality and remove shops that get many complaints.' },
  { icon: LuHandCoins, term: 'Fair prices', tag: 'No hidden fees', desc: 'Shops set their own prices. There are no hidden charges at checkout.' },
]

const faqs = [
  { id: 'f1', question: 'Why did my order arrive in separate parcels?', answer: 'Each shop sends its own parcel. So if you buy from three shops, you get three parcels, sometimes on different days.' },
  { id: 'f2', question: 'How is the delivery charge calculated?', answer: 'The delivery charge depends on your area: inside Dhaka, Dhaka suburbs or outside Dhaka. It is charged for each shop’s parcel. If you buy enough from one shop, that parcel is delivered free.' },
  { id: 'f3', question: 'Can I return part of an order?', answer: 'Yes. You can return items from one parcel within 7 days of delivery. Open the order in your account and choose “Request a return”.' },
  { id: 'f4', question: 'I have a shop. Can I sell here?', answer: 'Yes. Apply through “Sell on AmbalaEshop”. We check every application and reply within 7 days.' },
]

const topics = [
  { v: 'order', label: 'An order' },
  { v: 'product', label: 'A product' },
  { v: 'selling', label: 'Selling on AmbalaEshop' },
  { v: 'press', label: 'Business enquiry' },
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

/** Counts from 0 up to `to` once, with an ease-out curve. */
function useCountUp(to: number, duration = 1100) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, duration])
  return value
}

type HeroStat = { icon: IconType; value: number; label: string; hint: string }

function StatCell({ icon: Icon, value, label, hint }: HeroStat) {
  const shown = useCountUp(value)
  return (
    <div className="group relative flex flex-col items-center px-2 py-5 transition-colors duration-300 hover:bg-accent-soft/40 sm:px-4 sm:py-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/15 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 sm:h-11 sm:w-11">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <dd className="mt-3 font-display text-3xl font-extrabold leading-none tracking-[-0.04em] text-ink tabular-nums sm:text-4xl">
        {shown}
      </dd>
      <dt className="mt-1.5 text-sm font-semibold text-ink">{label}</dt>
      <p className="mt-0.5 hidden text-caption text-ink-mute sm:block">{hint}</p>
    </div>
  )
}

function HeroStats({ stats }: { stats: HeroStat[] }) {
  return (
    <motion.dl
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: easeEditorial }}
      className="relative mx-auto mt-10 grid max-w-xl grid-cols-3 divide-x divide-border overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_18px_44px_rgba(40,20,80,0.10)]"
    >
      {/* thin accent line along the top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent"
      />
      {stats.map((s) => (
        <StatCell key={s.label} {...s} />
      ))}
    </motion.dl>
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
              Helping local shops <em className="font-medium text-accent">sell online.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
              AmbalaEshop started in 2021. Many good shops in Bangladesh had no website of their own. We built
              one place where they can sell online, and where you can buy from all of them in one easy
              checkout.
            </p>

            <HeroStats
              stats={[
                { icon: LuStore, value: activeVendors.length, label: 'Shops', hint: 'Checked sellers' },
                { icon: LuPackage, value: products.length, label: 'Products', hint: 'Ready to order' },
                { icon: LuShoppingBag, value: 1, label: 'Checkout', hint: 'For every shop' },
              ]}
            />
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
                alt="A seller’s workshop"
                className="aspect-[5/4] w-full rounded-3xl object-cover"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-surface p-3 pr-5 shadow-[0_18px_40px_rgba(40,20,80,0.18)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <LuBadgeCheck className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">Every shop is checked</span>
                  <span className="block text-caption text-ink-mute">4 checks before it can sell</span>
                </span>
              </div>
            </div>

            <div>
              <DisplayHeading
                eyebrow="How we check shops"
                title={
                  <>
                    Four things we check <em>before a shop joins</em>
                  </>
                }
              />
              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {standards.map(({ icon: Icon, term, desc, tag }, i) => (
                  <motion.div
                    key={term}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: easeEditorial }}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-1 hover:border-accent/40! hover:shadow-[0_20px_44px_rgba(40,20,80,0.12)]"
                  >
                    {/* big ghost icon in the corner */}
                    <Icon
                      aria-hidden
                      className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 -rotate-12 text-accent/[0.06] transition-all duration-500 group-hover:rotate-0 group-hover:text-accent/[0.12]"
                    />

                    {/* accent bar that grows on hover */}
                    <span
                      aria-hidden
                      className="absolute inset-y-6 left-0 w-1 origin-center scale-y-0 rounded-r-full bg-accent transition-transform duration-300 group-hover:scale-y-100"
                    />

                    {/* icon tile with a tilted halo behind it */}
                    <span className="relative flex h-12 w-12">
                      <span
                        aria-hidden
                        className="absolute inset-0 rotate-12 rounded-2xl bg-accent-soft transition-transform duration-300 group-hover:rotate-[24deg] group-hover:scale-110"
                      />
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-accent to-accent-hover text-on-accent shadow-[0_8px_20px_rgba(109,40,217,0.35)]">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                    </span>

                    <dt className="relative mt-5 font-display text-lg font-bold tracking-[-0.01em] text-ink">{term}</dt>
                    <dd className="relative mt-1.5 text-sm leading-relaxed text-ink-soft">{desc}</dd>

                    <span className="relative mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-caption font-semibold text-accent">
                      <CheckIcon className="h-3.5 w-3.5" />
                      {tag}
                    </span>
                  </motion.div>
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
                    Need help? <em>Talk to us.</em>
                  </>
                }
                description="Questions about an order, a product or selling with us? Send us a message and we will reply soon."
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
                We reply within one working day
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
                    Thank you! We got your message and will reply soon.
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
