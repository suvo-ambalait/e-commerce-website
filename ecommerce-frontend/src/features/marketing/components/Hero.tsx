import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRightIcon, PlusIcon } from '@/shared/ui/icons'
import { LuBanknote, LuRotateCcw, LuShirt, LuSmartphone } from 'react-icons/lu'
import { easeEditorial } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'
import { discountFraction, formatPrice } from '@/shared/lib/format'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useCart } from '@/features/cart/context/CartContext'
import { useToast } from '@/shared/ui/Toast'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: easeEditorial, delay },
})

export function Hero() {
  const { products } = useCatalog()
  const { addItem } = useCart()
  const { notify } = useToast()

  // bestseller = best-rated featured piece (falls back to the whole catalogue)
  const pool = products.filter((p) => p.featured)
  const bestseller = [...(pool.length ? pool : products)].sort(
    (a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount,
  )[0]

  const maxOff = Math.round(
    Math.max(0, ...products.map((p) => discountFraction(p.price, p.originalPrice))) * 100,
  )

  const addBestseller = () => {
    if (!bestseller) return
    addItem(bestseller)
    notify(`${bestseller.name} added to cart`, 'success')
  }

  const perks = [
    { icon: LuBanknote, label: 'Cash on delivery' },
    { icon: LuRotateCcw, label: 'Easy 7-day returns' },
    { icon: LuSmartphone, label: 'bKash & Nagad accepted' },
  ]

  return (
    <section className="relative overflow-x-clip">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-10 sm:px-6 md:pt-14 lg:grid-cols-2 lg:gap-16 lg:px-10">
        {/* copy */}
        <div className="flex flex-col gap-7 pb-4 lg:gap-8 lg:pb-10">
          <motion.div
            {...rise(0)}
            className="flex items-center gap-2.5 self-start rounded-full border border-accent/20 bg-accent-soft py-2 pl-2 pr-3.5 text-[13px] font-medium text-ink-soft"
          >
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent">New</span>
            New products added this week
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            // `!` beats the global unlayered `h1` font rule in index.css
            className="m-0 font-display! text-[clamp(3.25rem,2rem+5vw,6.5rem)] font-extrabold! leading-[0.92] tracking-[-0.045em]! text-ink"
          >
            Shop from
            <br />
            <span className="font-medium italic text-accent">local sellers.</span>
          </motion.h1>

          <motion.p {...rise(0.16)} className="m-0 max-w-[500px] text-lg leading-relaxed text-ink-soft md:text-[19px]">
            Good quality products from trusted shops across Bangladesh. Order from many shops in one
            cart and pay cash when your parcel arrives.
          </motion.p>

          <motion.div {...rise(0.24)} className="flex flex-wrap items-center gap-3">
            <Link
              to="/shop"
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-accent px-7 text-base font-semibold text-on-accent shadow-md transition-colors hover:bg-accent-hover"
            >
              Start shopping
              <ArrowRightIcon className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/categories"
              className="inline-flex h-14 items-center rounded-full bg-ink px-7 text-base font-semibold text-bg transition-opacity hover:opacity-90"
            >
              See categories
            </Link>
          </motion.div>

          <motion.ul
            {...rise(0.32)}
            className="m-0 flex list-none flex-wrap gap-x-7 gap-y-3 p-0 pt-2 text-sm text-ink-soft"
          >
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="h-[18px] w-[18px] text-accent" aria-hidden />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* featured visual */}
        <motion.div
          aria-label="Featured product"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: easeEditorial, delay: 0.1 }}
          className="relative h-[460px] self-end sm:h-[560px] lg:h-[640px]"
        >
          <div className="absolute inset-y-0 left-0 right-0 overflow-hidden rounded-t-[32px] bg-accent sm:left-10">
            {/* decorative rings */}
            <div className="absolute -right-[120px] -top-[140px] h-[520px] w-[520px] rounded-full border border-white/30" />
            <div className="absolute -right-10 -top-[60px] h-[360px] w-[360px] rounded-full border border-white/25" />

            <div className="absolute inset-x-6 bottom-0 top-6 overflow-hidden rounded-t-3xl bg-accent-soft sm:inset-x-10 sm:top-10">
              <img
                src={imageFor('Textiles', 'hero-a', { w: 960, h: 1180 })}
                alt="Colourful handmade textiles"
                className="h-full w-full object-cover"
              />
            </div>

            {maxOff > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: -12 }}
                transition={{ duration: 0.6, ease: easeEditorial, delay: 0.5 }}
                className="absolute right-6 top-12 flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-ink font-display leading-none text-bg shadow-lg sm:right-10 sm:top-[72px]"
              >
                <span className="text-[13px] font-semibold tracking-[0.06em]">UP TO</span>
                <span className="text-[32px] font-extrabold">{maxOff}%</span>
                <span className="text-[13px] font-semibold tracking-[0.06em]">OFF</span>
              </motion.div>
            )}
          </div>

          {bestseller && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.6 },
                x: { duration: 0.6, ease: easeEditorial, delay: 0.6 },
                y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
              }}
              className="absolute bottom-6 left-3 flex w-[calc(100%-1.5rem)] max-w-[300px] items-center gap-3.5 rounded-[20px] bg-[#0b0a10] p-4 text-white ring-1 ring-transparent dark:ring-white/10 shadow-[0_24px_48px_rgba(40,20,80,0.25)] sm:bottom-12 sm:left-0"
            >
              <Link
                to={`/product/${bestseller.id}`}
                className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#ede9fe]"
              >
                {bestseller.images[0] ? (
                  <img src={bestseller.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <LuShirt className="h-7 w-7 text-accent" aria-hidden />
                )}
              </Link>
              <div className="flex min-w-0 grow flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.04em] text-[#c4b5fd]">BEST SELLER</span>
                <Link to={`/product/${bestseller.id}`} className="truncate text-base font-semibold hover:underline">
                  {bestseller.name}
                </Link>
                <span className="text-sm text-[#b8b3c7]">{formatPrice(bestseller.price)}</span>
              </div>
              <button
                type="button"
                onClick={addBestseller}
                aria-label={`Add ${bestseller.name} to cart`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-colors hover:bg-accent-hover"
              >
                <PlusIcon className="h-[18px] w-[18px]" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
