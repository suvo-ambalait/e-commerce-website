import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useIsDesktop } from '@/shared/hooks/useMediaQuery'
import {
  Avatar,
  Breadcrumbs,
  Button,
  ButtonLink,
  Container,
  Drawer,
  EmptyState,
  Pagination,
  Rating,
  Section,
  Select,
} from '@/shared/ui'
import { TruckIcon, LeafIcon } from '@/shared/ui/icons'
import { formatDateLong } from '@/shared/lib/format'
import { useVendors } from '../context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { FilterPanel } from '@/features/catalog/components/FilterPanel'
import { ProductGrid } from '@/features/catalog/components/ProductGrid'
import { sortOptions, useProductQuery, type SortKey } from '@/features/catalog/lib/useProductQuery'

export function VendorStorefrontPage() {
  const { slug } = useParams()
  const { getVendorBySlug } = useVendors()
  const { productsByVendor } = useCatalog()
  const isDesktop = useIsDesktop()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const vendor = slug ? getVendorBySlug(slug) : undefined
  const products = vendor ? productsByVendor(vendor.id) : []
  const query = useProductQuery(products, undefined, 9)

  useDocumentTitle(vendor ? `${vendor.name} · MorerDokan` : 'Maker · MorerDokan')

  if (!vendor) {
    return (
      <Container size="narrow" className="py-24 text-center">
        <h1 className="text-2xl text-ink">We can’t find that maker</h1>
        <ButtonLink to="/vendors" variant="secondary" className="mt-5">
          Back to directory
        </ButtonLink>
      </Container>
    )
  }

  return (
    <>
      <div className="relative h-40 overflow-hidden bg-surface-sunken sm:h-52 lg:h-60">
        <img src={vendor.banner} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent" />
      </div>

      <Container>
        <Avatar
          src={vendor.logo}
          name={vendor.name}
          size={84}
          className="relative -mt-10 flex border-4 border-bg shadow-sm"
        />
        <div className="mt-3">
          <Breadcrumbs
            items={[{ label: 'Home', to: '/' }, { label: 'Makers', to: '/vendors' }, { label: vendor.name }]}
          />
          <h1 className="mt-1 font-serif text-3xl text-ink">{vendor.name}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{vendor.tagline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-mute">
            <Rating value={vendor.rating} count={vendor.reviewCount} />
            <span>{vendor.location}</span>
            <span>Joined {formatDateLong(vendor.joinedAt)}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface-sunken/50 p-5 sm:grid-cols-[2fr_1fr]">
          <p className="text-sm leading-relaxed text-ink-soft">{vendor.bio}</p>
          <div className="space-y-2 text-caption text-ink-soft sm:border-l sm:border-border sm:pl-5">
            <p className="flex gap-2">
              <TruckIcon className="h-4 w-4 shrink-0 text-ink-mute" /> {vendor.policies.shipping}
            </p>
            <p className="flex gap-2">
              <LeafIcon className="h-4 w-4 shrink-0 text-ink-mute" /> {vendor.policies.returns}
            </p>
          </div>
        </div>
      </Container>

      <Section size="sm">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl text-ink">{products.length} pieces</h2>
            <div className="flex items-center gap-2">
              {!isDesktop && products.length > 0 && (
                <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
                  Filters
                </Button>
              )}
              <Select
                size="sm"
                aria-label="Sort"
                value={query.sort}
                onChange={(v) => query.setSort(v as SortKey)}
                options={sortOptions.map((o) => ({ value: o.value, label: o.label }))}
                className="w-44"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-10">
            {isDesktop && products.length > 0 && (
              <aside className="w-56 shrink-0">
                <FilterPanel
                  filters={query.filters}
                  update={query.update}
                  priceCeiling={query.priceCeiling}
                  hideVendors
                />
              </aside>
            )}
            <div className="min-w-0 flex-1">
              {query.pageItems.length > 0 ? (
                <>
                  <ProductGrid products={query.pageItems} columns={3} />
                  <Pagination page={query.page} totalPages={query.totalPages} onChange={query.setPage} className="mt-12" />
                </>
              ) : (
                <EmptyState title="No pieces match" description="Clear a filter to see this maker’s full range." />
              )}
            </div>
          </div>
        </Container>
      </Section>

      <Drawer open={drawerOpen && !isDesktop} onClose={() => setDrawerOpen(false)} side="left" title="Filters">
        <div className="p-5">
          <FilterPanel filters={query.filters} update={query.update} priceCeiling={query.priceCeiling} hideVendors />
          <Button fullWidth className="mt-6" onClick={() => setDrawerOpen(false)}>
            Show results
          </Button>
        </div>
      </Drawer>
    </>
  )
}
