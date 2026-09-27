import { motion } from 'motion/react'
import { Container, Section } from '@/shared/ui'
import { DisplayHeading } from './DisplayHeading'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { CategoryCard } from '@/features/catalog/components/CategoryCard'

export function CategoryStrip() {
  const { categories, products } = useCatalog()

  return (
    <Section as="section" id="categories">
      <Container>
        <DisplayHeading
          eyebrow="Browse"
          title={
            <>
              Shop by <em>category</em>
            </>
          }
          description="Everything for a calmer, better-made home — find your corner."
          action={{ to: '/categories', label: 'All categories' }}
        />

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
