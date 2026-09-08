import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, ButtonLink, Container, EmptyState, Section } from '@/shared/ui'
import { HeartIcon } from '@/shared/ui/icons'
import { useWishlist } from '../context/WishlistContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { ProductGrid } from '@/features/catalog/components/ProductGrid'

export function WishlistPage() {
  useDocumentTitle('Saved items · MorerDokan')
  const { productIds, clear } = useWishlist()
  const { products } = useCatalog()
  const saved = products.filter((p) => productIds.includes(p.id))

  return (
    <Section size="sm">
      <Container>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl text-ink">Saved items</h1>
          {saved.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear all
            </Button>
          )}
        </div>

        {saved.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={<HeartIcon />}
            title="Nothing saved yet"
            description="Tap the heart on any piece to keep it here for later."
            action={<ButtonLink to="/shop">Browse the shop</ButtonLink>}
          />
        ) : (
          <ProductGrid products={saved} className="mt-8" />
        )}
      </Container>
    </Section>
  )
}
