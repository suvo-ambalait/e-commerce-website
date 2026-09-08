import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Breadcrumbs, Container, Section } from '@/shared/ui'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { useCatalog } from '../context/CatalogContext'

export function CategoriesPage() {
  useDocumentTitle('Categories · MorerDokan')
  const { categories, products } = useCatalog()

  return (
    <Section size="sm">
      <Container>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Categories' }]} />
        <h1 className="mt-4 text-3xl text-ink">Every category</h1>
        <p className="mt-1 max-w-lg text-sm text-ink-soft">
          Eight departments, each stocked by several studios. Follow one through to the shop to filter
          by maker, price and material.
        </p>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={fadeUp}>
              <Link
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group block overflow-hidden rounded-lg border border-border"
              >
                <div className="relative aspect-[3/2] overflow-hidden bg-surface-sunken">
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-serif text-lg text-ink">{category.name}</p>
                    <span className="text-caption text-ink-mute">
                      {products.filter((p) => p.category === category.name).length}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{category.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}
