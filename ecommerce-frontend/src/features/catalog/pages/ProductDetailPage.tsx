import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LuArrowRight, LuCheck, LuLayers, LuSparkles, LuStore, LuTruck, LuZap } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import {
  Badge,
  Breadcrumbs,
  ButtonLink,
  Container,
  Price,
  QuantityStepper,
  Rating,
  Section,
  Tabs,
} from '@/shared/ui'
import { BagIcon, HeartIcon, TruckIcon, LeafIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { discountFraction, formatPercent, formatPrice } from '@/shared/lib/format'
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
/** little colour dot shown in each finish option */
const swatch: Record<string, string> = {
  Natural: 'bg-[#e8dcc6]',
  Charcoal: 'bg-[#3a3a3c]',
  Clay: 'bg-[#b8674a]',
}

export function ProductDetailPage() {
  const { id } = useParams()
  const { getProduct, products } = useCatalog()
  const { getVendor } = useVendors()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const { statusFor } = useInventory()
  const { notify } = useToast()
  const navigate = useNavigate()

  const product = id ? getProduct(id) : undefined
  const [color, setColor] = useState(COLORS[0])
  const [size] = useState(SIZES[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(addedTimer.current), [])

  useDocumentTitle(product ? `${product.name} · AmbalaEshop` : 'Product · AmbalaEshop')

  if (!product) {
    return (
      <Container size="narrow" className="py-24 text-center">
        <h1 className="text-2xl text-ink">This product is no longer for sale</h1>
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

  const stock = statusFor(product)
  const soldOut = product.stock <= 0

  const saving = product.originalPrice && product.originalPrice > product.price ? (product.originalPrice - product.price) * qty : 0

  const add = () => {
    addItem(product, { size, color, quantity: qty })
    notify(`${product.name} added to cart`, 'success')
    setAdded(true)
    window.clearTimeout(addedTimer.current)
    addedTimer.current = window.setTimeout(() => setAdded(false), 1600)
  }

  const buyNow = () => {
    addItem(product, { size, color, quantity: qty })
    navigate('/checkout')
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
                <p className="text-sm text-ink-soft">
                  Colour: <span className="font-semibold text-ink">{color}</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
                  {COLORS.map((c) => {
                    const selected = color === c
                    return (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setColor(c)}
                        className={cn(
                          'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-[border-color,background-color,box-shadow]',
                          selected
                            ? 'border-accent! bg-accent-soft text-ink ring-4 ring-accent/10'
                            : 'border-border-strong text-ink-soft hover:border-accent/50! hover:text-ink',
                        )}
                      >
                        <span className={cn('h-4 w-4 rounded-full ring-1 ring-black/10', swatch[c])} aria-hidden />
                        {c}
                        {selected && <LuCheck className="h-3.5 w-3.5 text-accent" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* purchase card */}
              <div className="mt-6 rounded-3xl border border-border bg-surface p-4 shadow-[0_14px_40px_rgba(40,20,80,0.07)] sm:p-5">
                {/* quantity + live total + save */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Quantity</p>
                    <QuantityStepper
                      value={qty}
                      onChange={setQty}
                      max={Math.max(1, product.stock)}
                      className={cn(soldOut && 'pointer-events-none opacity-50')}
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Total</p>
                      <p className="mt-1 font-display text-2xl font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                        {formatPrice(product.price * qty)}
                      </p>
                      {saving > 0 && (
                        <p className="mt-1 text-caption font-semibold text-success tabular-nums">
                          You save {formatPrice(saving)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={wishlisted ? 'Remove from saved items' : 'Save for later'}
                      aria-pressed={wishlisted}
                      title={wishlisted ? 'Saved' : 'Save for later'}
                      onClick={() => {
                        toggle(product.id)
                        notify(wishlisted ? 'Removed from saved items' : 'Saved for later', 'success')
                      }}
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-[color,background-color,border-color,transform] active:scale-90',
                        wishlisted
                          ? 'border-accent! bg-accent-soft text-accent'
                          : 'border-border-strong bg-surface text-ink-soft hover:border-accent! hover:text-accent',
                      )}
                    >
                      <HeartIcon className={cn('h-5 w-5', wishlisted && 'fill-current')} />
                    </button>
                  </div>
                </div>

                {/* actions */}
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={add}
                    disabled={soldOut}
                    className={cn(
                      'group relative inline-flex h-13 items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-5 text-sm font-semibold text-on-accent transition-[background-color,transform,box-shadow] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-ink-mute disabled:shadow-none',
                      added
                        ? 'bg-success shadow-[0_10px_24px_rgba(34,120,60,0.25)]'
                        : 'bg-accent shadow-[0_10px_28px_rgba(109,40,217,0.3)] hover:bg-accent-hover',
                      soldOut && 'sm:col-span-2',
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={soldOut ? 'out' : added ? 'added' : 'add'}
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -12, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="inline-flex items-center gap-2.5"
                      >
                        {added ? <LuCheck className="h-4.5 w-4.5" /> : <BagIcon className="h-4.5 w-4.5 shrink-0" />}
                        {soldOut ? 'Sold out' : added ? 'Added to cart' : 'Add to cart'}
                      </motion.span>
                    </AnimatePresence>
                  </button>

                  {!soldOut && (
                    <button
                      type="button"
                      onClick={buyNow}
                      className="group inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-bg transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
                    >
                      <LuZap className="h-4 w-4 text-[#c4b5fd]" />
                      Buy now
                      <LuArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>

                {/* stock */}
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5 text-caption">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="relative flex h-2 w-2">
                      {stock !== 'out' && (
                        <span
                          className={cn(
                            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                            stock === 'low' ? 'bg-warning' : 'bg-success',
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          'relative inline-flex h-2 w-2 rounded-full',
                          stock === 'out' ? 'bg-danger' : stock === 'low' ? 'bg-warning' : 'bg-success',
                        )}
                      />
                    </span>
                    {stock === 'out'
                      ? 'Out of stock right now'
                      : stock === 'low'
                        ? `Only ${product.stock} left — order soon`
                        : 'In stock, ready to ship'}
                  </span>
                  <span className="shrink-0 text-ink-mute tabular-nums">SKU {product.sku}</span>
                </div>
              </div>

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
                      icon: LuLayers,
                      content: (
                        <div className="space-y-4">
                          <p>{product.materials}</p>
                          <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-caption">
                            <div>
                              <dt className="text-ink-mute">Category</dt>
                              <dd className="mt-0.5 font-semibold text-ink">{product.category}</dd>
                            </div>
                            <div>
                              <dt className="text-ink-mute">SKU</dt>
                              <dd className="mt-0.5 font-mono font-semibold text-ink">{product.sku}</dd>
                            </div>
                          </dl>
                        </div>
                      ),
                    },
                    {
                      id: 'about-maker',
                      label: 'The seller',
                      icon: LuStore,
                      content: vendor ? (
                        <div>
                          <div className="flex items-center gap-3">
                            <Avatar src={vendor.logo} name={vendor.name} size={44} />
                            <div className="min-w-0">
                              <p className="truncate font-display text-base font-bold text-ink">{vendor.name}</p>
                              <p className="flex flex-wrap items-center gap-x-2 text-caption text-ink-mute">
                                <Rating value={vendor.rating} />
                                <span>{vendor.location}</span>
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 line-clamp-4">{vendor.bio}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              to={`/vendor/${vendor.slug}`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-caption font-semibold text-on-accent transition-colors hover:bg-accent-hover"
                            >
                              Visit the shop
                              <LuArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              to={`/reviews?shop=${vendor.slug}`}
                              className="inline-flex h-9 items-center rounded-full border border-border-strong px-4 text-caption font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                            >
                              Shop reviews
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p>Shop details aren’t available.</p>
                      ),
                    },
                    {
                      id: 'care',
                      label: 'Care',
                      icon: LuSparkles,
                      content: (
                        <ul className="space-y-2.5">
                          {[
                            'Clean with a soft, dry cloth.',
                            'Keep away from strong sunlight, heat and water.',
                            'For wooden items, apply a little oil once a year.',
                            'Ask the shop before washing it or using any cleaner.',
                          ].map((tip) => (
                            <li key={tip} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                                <LuCheck className="h-3 w-3" />
                              </span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                    {
                      id: 'delivery',
                      label: 'Delivery',
                      icon: LuTruck,
                      content: (
                        <div className="space-y-3">
                          {vendor && (
                            <>
                              <p className="flex items-start gap-2.5">
                                <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {vendor.policies.shipping}
                              </p>
                              <p className="flex items-start gap-2.5">
                                <LeafIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {vendor.policies.returns}
                              </p>
                            </>
                          )}
                          <p className="border-t border-border pt-3 text-caption text-ink-mute">
                            Cash on delivery, bKash, Nagad and card accepted.{' '}
                            <Link to="/shipping-returns" className="font-semibold text-accent hover:underline">
                              Delivery charges and returns
                            </Link>
                          </p>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      <ReviewsSection productId={product.id} />
      <RelatedProducts products={fromVendor} title={`More from ${vendor?.name ?? 'this shop'}`} />
      <RelatedProducts products={related} title="Similar products" />
    </>
  )
}
