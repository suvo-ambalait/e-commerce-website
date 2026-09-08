import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useIsDesktop } from '@/shared/hooks/useMediaQuery'
import {
  Badge,
  Breadcrumbs,
  Button,
  Container,
  Drawer,
  EmptyState,
  Pagination,
  Section,
  Select,
} from '@/shared/ui'
import { pluralize } from '@/shared/lib/format'
import { useCatalog } from '../context/CatalogContext'
import { FilterPanel } from '../components/FilterPanel'
import { ProductGrid } from '../components/ProductGrid'
import { sortOptions, useProductQuery, type SortKey } from '../lib/useProductQuery'

export function ShopPage() {
  const { products } = useCatalog()
  const [params, setParams] = useSearchParams()
  const isDesktop = useIsDesktop()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const categoryParam = params.get('category')
  const saleParam = params.get('sale') === 'true'
  const sortParam = params.get('sort') as SortKey | null

  const query = useProductQuery(
    products,
    {
      categories: categoryParam ? [categoryParam] : [],
      onSale: saleParam,
    },
    12,
  )

  useDocumentTitle(`${categoryParam ?? 'Shop'} · MorerDokan`)

  // keep filters in sync when the category is changed from the nav / mega-menu
  const lastCategory = useRef(categoryParam)
  useEffect(() => {
    if (lastCategory.current !== categoryParam) {
      lastCategory.current = categoryParam
      query.update({ categories: categoryParam ? [categoryParam] : [] })
    }
  }, [categoryParam, query])

  const heading = categoryParam ?? 'Shop all'

  return (
    <Section size="sm">
      <Container>
        <Breadcrumbs
          items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, ...(categoryParam ? [{ label: categoryParam }] : [])]}
        />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl text-ink">{heading}</h1>
            <p className="mt-1 text-sm text-ink-mute">
              {query.results.length} {pluralize(query.results.length, 'piece')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
                Filters {query.activeCount > 0 && <Badge tone="accent">{query.activeCount}</Badge>}
              </Button>
            )}
            <Select
              size="sm"
              aria-label="Sort products"
              value={query.sort}
              onChange={(v) => {
                query.setSort(v as SortKey)
                if (sortParam) {
                  params.delete('sort')
                  setParams(params, { replace: true })
                }
              }}
              options={sortOptions.map((o) => ({ value: o.value, label: o.label }))}
              className="w-48"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-10">
          {isDesktop && (
            <aside className="w-60 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink">Filters</h2>
                {query.activeCount > 0 && (
                  <button
                    type="button"
                    onClick={query.reset}
                    className="text-caption text-accent underline-offset-2 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="mt-5">
                <FilterPanel filters={query.filters} update={query.update} priceCeiling={query.priceCeiling} />
              </div>
            </aside>
          )}

          <div className="min-w-0 flex-1">
            {query.pageItems.length > 0 ? (
              <>
                <ProductGrid products={query.pageItems} />
                <Pagination page={query.page} totalPages={query.totalPages} onChange={query.setPage} className="mt-12" />
              </>
            ) : (
              <EmptyState
                title="Nothing matches those filters"
                description="Try widening the price range or clearing a category."
                action={
                  <Button variant="secondary" onClick={query.reset}>
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </Container>

      <Drawer open={drawerOpen && !isDesktop} onClose={() => setDrawerOpen(false)} side="left" title="Filters">
        <div className="p-5">
          <FilterPanel filters={query.filters} update={query.update} priceCeiling={query.priceCeiling} />
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" fullWidth onClick={query.reset}>
              Clear
            </Button>
            <Button fullWidth onClick={() => setDrawerOpen(false)}>
              Show {query.results.length}
            </Button>
          </div>
        </div>
      </Drawer>
    </Section>
  )
}
