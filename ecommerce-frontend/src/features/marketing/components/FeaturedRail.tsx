import { Link } from 'react-router-dom'
import { Container, Section, SectionHeading } from '@/shared/ui'
import { ProductGrid } from '@/features/catalog/components/ProductGrid'
import { useCatalog } from '@/features/catalog/context/CatalogContext'

export function FeaturedRail() {
  const { products } = useCatalog()
  const featured = products.filter((p) => p.featured).slice(0, 8)

  return (
    <Section id="featured" className="bg-surface-sunken/60">
      <Container>
        <SectionHeading
          eyebrow="This season"
          title="Pieces we keep coming back to"
          description="A rotating selection chosen with each studio — new work, quiet staples, and the odd thing on sale."
          action={
            <Link to="/shop" className="text-sm text-accent underline-offset-4 hover:underline">
              Shop all
            </Link>
          }
        />
        <ProductGrid products={featured} className="mt-10" />
      </Container>
    </Section>
  )
}
