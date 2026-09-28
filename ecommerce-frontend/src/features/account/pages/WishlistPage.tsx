import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, ButtonLink, EmptyState } from '@/shared/ui'
import { HeartIcon } from '@/shared/ui/icons'
import { useWishlist } from '../context/WishlistContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { ProductGrid } from '@/features/catalog/components/ProductGrid'
import { AccountCard } from '../components/AccountLayout'

export function WishlistPage() {
  useDocumentTitle('Saved items · AmbalaEshop')
  const { productIds, clear } = useWishlist()
  const { products } = useCatalog()
  const saved = products.filter((p) => productIds.includes(p.id))

  return (
    <AccountCard
      title="Saved items"
      subtitle={saved.length ? `${saved.length} ${saved.length > 1 ? 'products' : 'product'} saved for later` : undefined}
      aside={
        saved.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Remove every saved item?')) clear()
            }}
          >
            Clear all
          </Button>
        )
      }
    >
      {saved.length === 0 ? (
        <EmptyState
          icon={<HeartIcon />}
          title="Nothing saved yet"
          description="Tap the heart on any product to save it here for later."
          action={<ButtonLink to="/shop">Browse the shop</ButtonLink>}
        />
      ) : (
        <ProductGrid products={saved} columns={3} />
      )}
    </AccountCard>
  )
}
