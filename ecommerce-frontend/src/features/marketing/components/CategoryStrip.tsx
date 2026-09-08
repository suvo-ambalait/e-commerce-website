import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Container, Section, SectionHeading } from '@/shared/ui'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { useCatalog } from '@/features/catalog/context/CatalogContext'

export function CategoryStrip() {
  const { categories, products } = useCatalog()

  return (
    <Section as="section" id="categories">
      <Container>
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          action={
            <Link to="/categories" className="text-sm text-accent underline-offset-4 hover:underline">
              All categories
            </Link>
          }
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={fadeUp}>
              <Link
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group relative block overflow-hidden rounded-md"
              >
                <div className="aspect-square">
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <p className="font-serif text-base text-white">{category.name}</p>
                  <p className="text-caption text-white/75">
                    {products.filter((p) => p.category === category.name).length} pieces
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}
