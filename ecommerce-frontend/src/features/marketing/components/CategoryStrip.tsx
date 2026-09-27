import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Container, Section } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { CategoryCard } from '@/features/catalog/components/CategoryCard'

export function CategoryStrip() {
  const { categories, products } = useCatalog()

  return (
    <Section as="section" id="categories">
      <Container>
        {/* heading */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Browse
            </p>
            {/* `!` beats the global unlayered h2 font rule in index.css */}
            <h2 className="mt-3 font-display! text-[clamp(2rem,1.4rem+2.6vw,3.25rem)] font-extrabold! leading-none tracking-[-0.04em]! text-ink">
              Shop by <span className="font-medium italic text-accent">category</span>
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              Everything for a calmer, better-made home — find your corner.
            </p>
          </div>

          <Link
            to="/categories"
            className="group inline-flex h-11 shrink-0 items-center gap-3 self-start rounded-full border border-border-strong bg-surface pl-5 pr-1.5 text-sm font-semibold text-ink transition-colors hover:border-accent sm:self-auto"
          >
            All categories
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-bg transition-colors group-hover:bg-accent group-hover:text-on-accent">
              <ArrowRightIcon className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {/* grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-9 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-5 md:grid-cols-4"
        >
          {categories.map((category) => {
            const count = products.filter((p) => p.category === category.name).length
            return (
              <motion.div key={category.id} variants={fadeUp}>
                <CategoryCard category={category} count={count} />
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </Section>
  )
}
