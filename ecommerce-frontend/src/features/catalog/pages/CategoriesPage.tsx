import { motion } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Breadcrumbs, Container, Section } from '@/shared/ui'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { useCatalog } from '../context/CatalogContext'
import { CategoryCard } from '../components/CategoryCard'

export function CategoriesPage() {
  useDocumentTitle('Categories · AmbalaEshop')
  const { categories, products } = useCatalog()

  return (
    <Section size="sm">
      <Container>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Categories' }]} />

        <p className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {categories.length} categories
        </p>
        {/* `!` beats the global unlayered h1 font rule in index.css */}
        <h1 className="mt-3 font-display! text-[clamp(2.25rem,1.5rem+3vw,3.75rem)] font-extrabold! leading-none tracking-[-0.04em]! text-ink">
          All <span className="font-medium italic text-accent">categories</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm text-ink-soft">
          Pick a category to see its products. You can then filter by shop, price and more.
        </p>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={fadeUp}>
              <CategoryCard
                category={category}
                count={products.filter((p) => p.category === category.name).length}
                showDescription
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}
