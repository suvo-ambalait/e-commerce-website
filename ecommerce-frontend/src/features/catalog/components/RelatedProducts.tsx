import { Container, Section, SectionHeading } from '@/shared/ui'
import { ProductGrid } from './ProductGrid'
import type { Product } from '@/shared/types'

export function RelatedProducts({ products, title = 'You might also like' }: { products: Product[]; title?: string }) {
  if (products.length === 0) return null
  return (
    <Section className="bg-surface-sunken/50">
      <Container>
        <SectionHeading title={title} />
        <ProductGrid products={products.slice(0, 4)} className="mt-8" />
      </Container>
    </Section>
  )
}
