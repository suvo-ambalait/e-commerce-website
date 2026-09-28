import { motion } from 'motion/react'
import { LuBanknote, LuRotateCcw, LuShoppingBag, LuTruck } from 'react-icons/lu'
import { Container, Section } from '@/shared/ui'
import { fadeUp, stagger } from '@/shared/lib/motion'

const items = [
  {
    icon: LuShoppingBag,
    title: 'One cart, many shops',
    fact: 'Pay once',
    body: 'Buy from many shops in one order. You pay once, and we handle the rest with each shop.',
  },
  {
    icon: LuTruck,
    title: 'Home delivery',
    fact: '1–2 days in Dhaka',
    body: 'Delivery all over Bangladesh. Inside Dhaka in 1–2 days, outside Dhaka in 3–5 days.',
  },
  {
    icon: LuBanknote,
    title: 'Cash on delivery',
    fact: 'bKash · Nagad · Card',
    body: 'Pay in cash when your parcel arrives. You can also pay with bKash, Nagad or card.',
  },
  {
    icon: LuRotateCcw,
    title: 'Easy 7-day returns',
    fact: '7 days to decide',
    body: 'Not happy with a product? Ask for a return within 7 days of delivery.',
  },
]

export function ValueProps() {
  return (
    <Section size="sm" className="border-y border-border bg-surface-sunken/40">
      <Container>
        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map(({ icon: Icon, title, fact, body }) => (
            <motion.li
              key={title}
              variants={fadeUp}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-1 hover:border-accent/40! hover:shadow-[0_18px_40px_rgba(40,20,80,0.10)]"
            >
              {/* soft glow in the corner, brighter on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl transition-opacity duration-300 group-hover:bg-accent/20"
              />

              <div className="relative flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-accent to-accent-hover text-on-accent shadow-[0_8px_18px_rgba(109,40,217,0.3)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="mt-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-accent">
                  {fact}
                </span>
              </div>

              <p className="relative mt-4 font-display text-base font-bold tracking-[-0.01em] text-ink">{title}</p>
              <p className="relative mt-1.5 text-caption leading-relaxed text-ink-mute">{body}</p>

              {/* accent line that draws in along the bottom on hover */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100"
              />
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </Section>
  )
}
