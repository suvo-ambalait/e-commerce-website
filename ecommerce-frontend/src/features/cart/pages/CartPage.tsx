import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ButtonLink, Container, EmptyState, Section } from '@/shared/ui'
import { BagIcon } from '@/shared/ui/icons'
import { pluralize } from '@/shared/lib/format'
import { useCart } from '../context/CartContext'
import { useCartPricing } from '../lib/useCartPricing'
import { CartVendorGroup } from '../components/CartVendorGroup'
import { OrderSummary } from '../components/OrderSummary'
import { RelatedProducts } from '@/features/catalog/components/RelatedProducts'
import { useCatalog } from '@/features/catalog/context/CatalogContext'

export function CartPage() {
  useDocumentTitle('Cart · MorerDokan')
  const { items, groups } = useCart()
  const pricing = useCartPricing()
  const { products } = useCatalog()

  if (items.length === 0) {
    return (
      <Section>
        <Container>
          <h1 className="text-3xl text-ink">Your cart</h1>
          <EmptyState
            className="mt-8"
            icon={<BagIcon />}
            title="Nothing in the cart yet"
            description="When you add pieces from a few different makers, they’ll be grouped here by studio."
            action={<ButtonLink to="/shop">Start browsing</ButtonLink>}
          />
        </Container>
        <RelatedProducts products={products.filter((p) => p.featured)} title="Popular right now" />
      </Section>
    )
  }

  return (
    <Section size="sm">
      <Container>
        <h1 className="text-3xl text-ink">Your cart</h1>
        <p className="mt-1 text-sm text-ink-mute">
          {items.length} {pluralize(items.length, 'item')} from {groups.length}{' '}
          {pluralize(groups.length, 'maker')}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <div className="space-y-5">
            {groups.map((group) => (
              <CartVendorGroup key={group.vendorId} group={group} />
            ))}
          </div>

          <div className="lg:sticky lg:top-28">
            <OrderSummary
              pricing={pricing}
              footer={
                <ButtonLink to="/checkout" fullWidth size="lg">
                  Checkout
                </ButtonLink>
              }
            />
            <ButtonLink to="/shop" variant="ghost" className="mt-3 w-full justify-center">
              Continue shopping
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  )
}
