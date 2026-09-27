import { Link } from 'react-router-dom'
import { LuLock } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container, Section } from '@/shared/ui'
import { ArrowLeftIcon, ArrowRightIcon, BagIcon } from '@/shared/ui/icons'
import { pluralize } from '@/shared/lib/format'
import { useCart } from '../context/CartContext'
import { useCartPricing } from '../lib/useCartPricing'
import { CartVendorGroup } from '../components/CartVendorGroup'
import { OrderSummary } from '../components/OrderSummary'
import { CheckoutHeader, CheckoutSteps } from '@/features/checkout/components/CheckoutSteps'
import { RelatedProducts } from '@/features/catalog/components/RelatedProducts'
import { useCatalog } from '@/features/catalog/context/CatalogContext'

export function CartPage() {
  useDocumentTitle('Cart · MorerDokan')
  const { items, groups, totalItems } = useCart()
  const pricing = useCartPricing()
  const { products } = useCatalog()

  if (items.length === 0) {
    return (
      <Section size="sm" className="bg-surface-sunken/50">
        <Container>
          <CheckoutHeader
            title={
              <>
                Your <em>cart</em>
              </>
            }
            steps={<CheckoutSteps current="cart" />}
          />
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-border bg-surface px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <BagIcon className="h-7 w-7" />
            </span>
            <p className="mt-5 font-display text-xl font-bold text-ink">Nothing in the cart yet</p>
            <p className="mt-2 max-w-sm text-sm text-ink-soft">
              When you add pieces from a few different makers, they’ll be grouped here by studio.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Start browsing
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </Container>
        <RelatedProducts products={products.filter((p) => p.featured)} title="Popular right now" />
      </Section>
    )
  }

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        <CheckoutHeader
          title={
            <>
              Your <em>cart</em>
            </>
          }
          subtitle={`${totalItems} ${pluralize(totalItems, 'item')} from ${groups.length} ${pluralize(groups.length, 'maker')}`}
          steps={<CheckoutSteps current="cart" />}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <div className="space-y-5">
            {groups.map((group) => (
              <CartVendorGroup key={group.vendorId} group={group} />
            ))}
          </div>

          <div className="lg:sticky lg:top-28">
            <OrderSummary
              pricing={pricing}
              footer={
                <Link
                  to="/checkout"
                  className="group flex h-13 items-center justify-between rounded-full bg-[#6d28d9] pl-6 pr-1.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(109,40,217,0.45)] transition-colors hover:bg-[#7c3aed]"
                >
                  <span className="flex items-center gap-2">
                    <LuLock className="h-4 w-4" />
                    Secure checkout
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6d28d9]">
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              }
            />
            <Link
              to="/shop"
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Continue shopping
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  )
}
