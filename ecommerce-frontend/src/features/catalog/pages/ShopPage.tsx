import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useIsDesktop } from '@/shared/hooks/useMediaQuery'
import { LuSlidersHorizontal } from 'react-icons/lu'
import {
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

  useDocumentTitle(`${categoryParam ?? 'Shop'} · AmbalaEshop`)

  // keep filters in sync when the category is changed from the nav / mega-menu
  const lastCategory = useRef(categoryParam)
  useEffect(() => {
    if (lastCategory.current !== categoryParam) {
      lastCategory.current = categoryParam
      query.update({ categories: categoryParam ? [categoryParam] : [] })
    }
  }, [categoryParam, query])

  const makerCount = new Set(query.results.map((p) => p.vendorId)).size

  return (
    <Section size="sm">
      <Container>
        <Breadcrumbs
          items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, ...(categoryParam ? [{ label: categoryParam }] : [])]}
        />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            {/* `!` beats the global unlayered h1 font rule in index.css */}
            <h1 className="font-display! text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] font-extrabold! leading-none tracking-[-0.04em]! text-ink">
              Shop <em className="font-medium text-accent">{categoryParam ?? 'all'}</em>
            </h1>
            <p className="mt-2 text-sm text-ink-mute">
              {query.results.length} {pluralize(query.results.length, 'piece')} from {makerCount}{' '}
              {pluralize(makerCount, 'maker')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex h-10 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-accent"
              >
                <LuSlidersHorizontal className="h-4 w-4 text-accent" />
                Filters
                {query.activeCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] text-on-accent">
                    {query.activeCount}
                  </span>
                )}
              </button>
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

        <div className="mt-8 flex gap-8">
          {isDesktop && (
            <aside className="w-64 shrink-0">
              <FilterPanel query={query} products={products} />
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

      <Drawer
        open={drawerOpen && !isDesktop}
        onClose={() => setDrawerOpen(false)}
        side="left"
        header={<></>}
        widthClass="w-full max-w-sm"
      >
        <FilterPanel
          query={query}
          products={products}
          onClose={() => setDrawerOpen(false)}
          onShowResults={() => setDrawerOpen(false)}
        />
      </Drawer>
    </Section>
  )
}
