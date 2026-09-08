import { motion } from 'motion/react'
import { Container, Section } from '@/shared/ui'
import { LeafIcon, TruckIcon, SparkIcon, StoreIcon } from '@/shared/ui/icons'
import { fadeUp, stagger } from '@/shared/lib/motion'

const items = [
  {
    icon: StoreIcon,
    title: 'One cart, many studios',
    body: 'Buy from six makers at once. We split the order and settle up with each of them.',
  },
  {
    icon: TruckIcon,
    title: 'Shipped by the maker',
    body: 'Pieces come straight from the workshop, packed by the people who made them.',
  },
  {
    icon: LeafIcon,
    title: 'Material transparency',
    body: 'Every listing states what it’s made of and where that material came from.',
  },
  {
    icon: SparkIcon,
    title: '30-day returns',
    body: 'Stock items can go back within 30 days. Custom work is agreed up front.',
  },
]

export function ValueProps() {
  return (
    <Section size="sm" className="border-y border-border bg-surface-sunken/40">
      <Container>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="group flex flex-col gap-3 bg-bg p-6 transition-colors duration-[var(--dur-2)] hover:bg-surface"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-accent transition-colors group-hover:border-accent group-hover:bg-accent-soft">
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span className="font-serif text-lg text-ink-mute/40">0{i + 1}</span>
              </div>
              <p className="text-sm font-medium text-ink">{item.title}</p>
              <p className="text-caption leading-relaxed text-ink-mute">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}
