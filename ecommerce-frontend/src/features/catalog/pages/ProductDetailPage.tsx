import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import {
  Badge,
  Breadcrumbs,
  Button,
  ButtonLink,
  Container,
  Price,
  QuantityStepper,
  Rating,
  Section,
  Tabs,
} from '@/shared/ui'
import { HeartIcon, TruckIcon, LeafIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { discountFraction, formatPercent } from '@/shared/lib/format'
import { useCatalog } from '../context/CatalogContext'
import { useCart } from '@/features/cart/context/CartContext'
import { useWishlist } from '@/features/account/context/WishlistContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useToast } from '@/shared/ui/Toast'
import { ImageGallery } from '../components/ImageGallery'
import { ReviewsSection } from '../components/ReviewsSection'
import { RelatedProducts } from '../components/RelatedProducts'
import { Avatar } from '@/shared/ui'

const SIZES = ['One size']
const COLORS = ['Natural', 'Charcoal', 'Clay']

export function ProductDetailPage() {
  const { id } = useParams()
  const { getProduct, products } = useCatalog()
  const { getVendor } = useVendors()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const { statusFor } = useInventory()
  const { notify } = useToast()

  const product = id ? getProduct(id) : undefined
  const [color, setColor] = useState(COLORS[0])
  const [size] = useState(SIZES[0])
  const [qty, setQty] = useState(1)

  useDocumentTitle(product ? `${product.name} · MorerDokan` : 'Product · MorerDokan')

  if (!product) {
    return (
      <Container size="narrow" className="py-24 text-center">
        <h1 className="text-2xl text-ink">This piece is no longer listed</h1>
        <ButtonLink to="/shop" variant="secondary" className="mt-5">
          Back to shop
        </ButtonLink>
      </Container>
    )
  }

  const vendor = getVendor(product.vendorId)
  const wishlisted = isWishlisted(product.id)
  const off = discountFraction(product.price, product.originalPrice)
  const related = products.filter((p) => p.category === product.category && p.id !== product.id)
  const fromVendor = products.filter((p) => p.vendorId === product.vendorId && p.id !== product.id)

  const add = () => {
    addItem(product, { size, color, quantity: qty })
    notify(`${product.name} added to cart`, 'success')
  }

  return (
    <>
      <Section size="sm">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Shop', to: '/shop' },
              { label: product.category, to: `/shop?category=${encodeURIComponent(product.category)}` },
              { label: product.name },
            ]}
          />

          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ImageGallery images={product.images} alt={product.name} />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {vendor && (
                <Link
                  to={`/vendor/${vendor.slug}`}
                  className="inline-flex items-center gap-2 text-caption uppercase tracking-wide text-ink-mute transition-colors hover:text-ink"
                >
                  <Avatar src={vendor.logo} name={vendor.name} size={22} />
                  {vendor.name}
                </Link>
              )}
              <h1 className="mt-2 text-3xl text-ink">{product.name}</h1>
              <div className="mt-3 flex items-center gap-3">
                <Rating value={product.rating} count={product.reviewCount} showValue />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <Price value={product.price} originalPrice={product.originalPrice} size="lg" />
                {off > 0 && <Badge tone="sale">Save {formatPercent(off)}</Badge>}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-ink-soft">{product.description}</p>

              <div className="mt-7">
                <p className="text-caption font-medium uppercase tracking-wide text-ink-soft">Finish</p>
                <div className="mt-2 flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-caption transition-colors',
                        color === c ? 'border-transparent bg-ink text-bg' : 'border-border-strong text-ink-soft hover:border-ink',
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
                <Button onClick={add} size="lg" disabled={product.stock <= 0} className="flex-1 min-w-48">
                  {product.stock <= 0 ? 'Sold out' : 'Add to cart'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  aria-label="Save for later"
                  onClick={() => toggle(product.id)}
                  className="px-4"
                >
                  <HeartIcon className={cn('h-5 w-5', wishlisted && 'fill-accent text-accent')} />
                </Button>
              </div>
              <p className="mt-2 text-caption text-ink-mute">
                {statusFor(product) === 'out'
                  ? `Currently sold out · SKU ${product.sku}`
                  : statusFor(product) === 'low'
                    ? `Only ${product.stock} left — made in small batches`
                    : `In stock · SKU ${product.sku}`}
              </p>

              {vendor && (
                <div className="mt-6 space-y-2 rounded-lg border border-border bg-surface-sunken/60 p-4 text-caption text-ink-soft">
                  <p className="flex items-center gap-2">
                    <TruckIcon className="h-4 w-4 text-ink-mute" /> {vendor.policies.shipping}
                  </p>
                  <p className="flex items-center gap-2">
                    <LeafIcon className="h-4 w-4 text-ink-mute" /> {vendor.policies.returns}
                  </p>
                </div>
              )}

              <div className="mt-8">
                <Tabs
                  items={[
                    {
                      id: 'materials',
                      label: 'Materials',
                      content: <p>{product.materials}</p>,
                    },
                    {
                      id: 'about-maker',
                      label: 'The maker',
                      content: (
                        <div>
                          <p>{vendor?.bio}</p>
                          {vendor && (
                            <Link to={`/vendor/${vendor.slug}`} className="mt-3 inline-block text-accent underline-offset-4 hover:underline">
                              Visit {vendor.name}
                            </Link>
                          )}
                        </div>
                      ),
                    },
                    {
                      id: 'care',
                      label: 'Care',
                      content: <p>Dust with a dry cloth. Avoid direct sun and heat sources. Re-oil timber annually with a food-safe hardwax oil where applicable.</p>,
                    },
                  ]}
                />
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      <ReviewsSection productId={product.id} />
      <RelatedProducts products={fromVendor} title={`More from ${vendor?.name ?? 'this maker'}`} />
      <RelatedProducts products={related} title="Similar pieces" />
    </>
  )
}
