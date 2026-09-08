import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Breadcrumbs, ButtonLink, Container, Section } from '@/shared/ui'
import { useVendors } from '../context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { VendorCard } from '../components/VendorCard'

export function VendorDirectoryPage() {
  useDocumentTitle('Makers · MorerDokan')
  const { activeVendors } = useVendors()
  const { productsByVendor } = useCatalog()

  return (
    <Section size="sm">
      <Container>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Makers' }]} />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl text-ink">The makers</h1>
            <p className="mt-1 max-w-lg text-sm text-ink-soft">
              {activeVendors.length} independent studios sell on MorerDokan. Each keeps its own storefront,
              sets its own prices, and ships its own work.
            </p>
          </div>
          <ButtonLink to="/vendor/signup" variant="secondary">
            Apply to sell
          </ButtonLink>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} productCount={productsByVendor(vendor.id).length} />
          ))}
        </div>
      </Container>
    </Section>
  )
}
