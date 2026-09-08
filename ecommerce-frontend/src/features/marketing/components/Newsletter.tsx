import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Container, Section } from '@/shared/ui'
import { ArrowRightIcon, CheckIcon } from '@/shared/ui/icons'
import { fadeUp, revealOnScroll } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'

const perks = [
  'New arrivals before they reach the shop',
  'Studio restock alerts for your saved pieces',
  'First access to limited runs',
]

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
          className="overflow-hidden rounded-xl border border-ink/10 shadow-lg"
        >
          <div className="grid lg:grid-cols-[1.15fr_1fr]">
            {/* copy + form */}
            <div className="relative bg-ink px-7 py-12 sm:px-12 sm:py-16">
              <span className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

              <p className="text-caption font-medium uppercase tracking-[0.2em] text-accent">
                The MorerDokan letter
              </p>
              <h2 className="mt-4 font-serif text-3xl leading-[1.1] text-bg text-balance sm:text-[2.5rem]">
                New work, one email a week
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-bg/60">
                A short Friday note when studios release something, restock a favourite, or open a
                limited run. Nothing else.
              </p>

              <ul className="mt-7 space-y-2.5">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-bg/80">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {perk}
                  </li>
                ))}
              </ul>

              {done ? (
                <div className="mt-8 flex items-center gap-2 rounded-full bg-bg/10 px-4 py-2.5 text-sm text-bg">
                  <CheckIcon className="h-4 w-4 text-success" />
                  You’re on the list — see you Friday.
                </div>
              ) : (
                <>
                  <form onSubmit={submit} className="mt-8 flex max-w-md flex-col gap-2.5 sm:flex-row">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      aria-label="Email address"
                      className="h-12 flex-1 rounded-full border border-bg/20 bg-bg/5 px-5 text-sm text-bg placeholder:text-bg/40 outline-none transition-colors focus:border-bg/60"
                    />
                    <button
                      type="submit"
                      className="group flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-bg px-6 text-sm font-medium text-ink transition-colors hover:bg-accent hover:text-on-accent"
                    >
                      Subscribe
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>
                  <p className="mt-3 text-[0.7rem] text-bg/40">No spam. Unsubscribe in one click.</p>
                </>
              )}
            </div>

            {/* image — only in the two-column layout */}
            <div className="relative hidden min-h-full lg:block">
              <img
                src={imageFor('Studio', 'newsletter-panel', { w: 900, h: 1100 })}
                alt="Inside a maker's studio"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-ink/20" />
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}
