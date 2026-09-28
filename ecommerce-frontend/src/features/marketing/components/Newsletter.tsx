import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Container, Section } from '@/shared/ui'
import { ArrowRightIcon, CheckIcon, MailIcon } from '@/shared/ui/icons'
import { fadeUp, revealOnScroll } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'

const perks = [
  'Hear about new products first',
  'Know when saved items are back in stock',
  'Get special offers and discount codes',
]

/** Light violet panel — the white-theme counterpart to the dark EditorialPromo above it. */
export function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (email.trim()) setDone(true)
  }

  return (
    <Section>
      <Container>
        <motion.div
          variants={fadeUp}
          {...revealOnScroll}
          className="relative grid grid-cols-1 gap-3 overflow-hidden rounded-3xl border border-accent/15! bg-accent-soft/60 p-3 lg:grid-cols-[1.15fr_1fr]"
        >
          {/* decorative rings — `!` beats the global `* { border-color }` rule in index.css */}
          <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full border border-accent/15!" />
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-accent/15!" />

          {/* copy + form */}
          <div className="relative flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Newsletter
            </p>
            {/* `!` beats the global unlayered h2 font rule in index.css */}
            <h2 className="mt-4 font-display! text-[clamp(2rem,1.3rem+2.8vw,3.25rem)] font-extrabold! leading-[1.02] tracking-[-0.04em]! text-ink">
              Get offers
              <br />
              <em className="font-medium text-accent">by email</em>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              One short email every week with new products, offers and discount codes. We never send
              anything else.
            </p>

            <ul className="mt-6 space-y-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-sm font-medium text-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>

            {done ? (
              <div className="mt-8 flex max-w-md items-center gap-3 rounded-full bg-surface px-5 py-3 text-sm font-medium text-ink shadow-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-soft text-success">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                Thank you! You will get our next email.
              </div>
            ) : (
              <>
                <form
                  onSubmit={submit}
                  className="mt-8 flex max-w-md flex-col gap-2 rounded-3xl bg-surface p-1.5 shadow-[0_10px_30px_rgba(40,20,80,0.08)] ring-1 ring-border transition-shadow focus-within:ring-2 focus-within:ring-accent sm:flex-row sm:rounded-full"
                >
                  <label className="flex h-11 flex-1 items-center gap-2.5 pl-4">
                    <MailIcon className="h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      aria-label="Email address"
                      className="h-full w-full min-w-0 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute focus:ring-0"
                    />
                  </label>
                  <button
                    type="submit"
                    className="group flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent shadow-[0_8px_20px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover"
                  >
                    Subscribe
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
                <p className="mt-3 pl-4 text-[0.7rem] text-ink-mute">No spam. You can stop the emails any time.</p>
              </>
            )}
          </div>

          {/* image */}
          <div className="relative hidden min-h-120 overflow-hidden rounded-2xl lg:block">
            <img
              src={imageFor('Studio', 'newsletter-panel', { w: 900, h: 1100 })}
              alt="Inside a seller’s workshop"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-surface p-3 pr-5 text-ink shadow-[0_18px_40px_rgba(40,20,80,0.18)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <MailIcon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">Every Friday</span>
                <span className="block text-caption text-ink-mute">One email, zero noise</span>
              </span>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}
