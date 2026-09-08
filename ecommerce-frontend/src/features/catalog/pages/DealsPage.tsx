import { useMemo } from 'react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Breadcrumbs, Container, EmptyState, Section } from '@/shared/ui'
import { discountFraction } from '@/shared/lib/format'
import { useCatalog } from '../context/CatalogContext'
import { ProductGrid } from '../components/ProductGrid'

export function DealsPage() {
  useDocumentTitle('Sale · MorerDokan')
  const { products } = useCatalog()

  const deals = useMemo(
    () =>
      products
        .filter((p) => p.originalPrice && p.originalPrice > p.price)
        .sort((a, b) => discountFraction(b.price, b.originalPrice) - discountFraction(a.price, a.originalPrice)),
    [products],
  )

  return (
    <Section size="sm">
      <Container>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Sale' }]} />
        <h1 className="mt-4 text-3xl text-ink">On sale now</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {deals.length} pieces marked down by their makers — mostly last-of-a-run and seconds.
        </p>

        <div className="mt-10">
          {deals.length > 0 ? (
            <ProductGrid products={deals} />
          ) : (
            <EmptyState title="No markdowns right now" description="Check back after the next studio restock." />
          )}
        </div>
      </Container>
    </Section>
  )
}
