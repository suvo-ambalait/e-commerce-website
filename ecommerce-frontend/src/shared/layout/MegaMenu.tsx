import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import type { Category } from '@/shared/types'
import { ArrowRightIcon, ChevronDownIcon } from '@/shared/ui/icons'

const quickLinks = [
  { label: 'New this week', to: '/shop?sort=new' },
  { label: 'On sale', to: '/deals', accent: true },
  { label: 'Gift ideas', to: '/shop' },
]

export function MegaMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const { products } = useCatalog()
  const active = pathname.startsWith('/categories')
  useClickOutside(ref, () => setOpen(false), open)

  const close = () => setOpen(false)
  const countFor = (name: string) => products.filter((p) => p.category === name).length

  return (
    <div ref={ref} className="relative" onMouseLeave={close}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        className={cn(
          'flex h-8 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors',
          active || open ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
        )}
      >
        Categories
        <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: easeEditorial }}
            className="absolute left-0 top-full z-50 w-3xl max-w-[calc(100vw-2rem)] pt-3"
          >
            <div className="grid grid-cols-[1fr_14rem] gap-3 rounded-3xl border border-border bg-surface p-3 shadow-[0_24px_60px_rgba(40,20,80,0.18)]">
              {/* categories */}
              <div className="flex flex-col p-2">
                <div className="flex items-center justify-between px-2 pb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Browse by category</p>
                  <p className="text-caption text-ink-mute">{categories.length} categories</p>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/shop?category=${encodeURIComponent(category.name)}`}
                      onClick={close}
                      className="group/item relative flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-accent-soft focus-visible:bg-accent-soft"
                    >
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-accent-soft ring-2 ring-transparent transition-shadow group-hover/item:ring-accent">
                        <img src={category.image} alt="" className="h-full w-full object-cover" />
                      </span>
                      <span className="min-w-0 flex-1 pr-5">
                        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                          <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink transition-colors group-hover/item:text-accent">
                            {category.name}
                          </span>
                          <span className="text-caption text-ink-mute tabular-nums">{countFor(category.name)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-caption leading-snug text-ink-soft">
                          {category.description}
                        </span>
                      </span>
                      <span className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 scale-75 items-center justify-center rounded-full bg-accent text-on-accent opacity-0 transition-[opacity,transform] duration-200 group-hover/item:scale-100 group-hover/item:opacity-100">
                        <ArrowRightIcon className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-2 pt-3.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">Quick links</span>
                  {quickLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={close}
                      className={cn(
                        'text-sm font-medium transition-colors hover:text-accent',
                        link.accent ? 'text-accent' : 'text-ink',
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* promo card */}
              <div className="relative flex flex-col overflow-hidden rounded-2xl bg-[#6d28d9] text-white">
                <div className="h-44 shrink-0 overflow-hidden">
                  <img
                    src={imageFor('Studio', 'promo-workshop', { w: 480, h: 360 })}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="relative flex flex-1 flex-col p-4">
                  {/* decorative rings — `!` beats the global `* { border-color }` rule in index.css */}
                  <div className="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full border border-white/15!" />
                  <div className="pointer-events-none absolute -bottom-10 -right-6 h-28 w-28 rounded-full border border-white/15!" />

                  <span className="self-start rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Every shop
                  </span>
                  <p className="mt-3 font-display text-[1.6rem] font-extrabold leading-none tracking-[-0.035em]">
                    Shop <em className="font-medium">everything</em>
                  </p>
                  <p className="mt-2 text-caption leading-relaxed text-white/80">
                    All {categories.length} categories, one cart, one checkout.
                  </p>
                  <Link
                    to="/shop"
                    onClick={close}
                    className="group/cta relative mt-auto flex h-11 items-center justify-between rounded-full bg-white pl-4 pr-1.5 text-sm font-semibold text-[#0b0a10] transition-colors hover:bg-[#ede9fe]"
                  >
                    View all products
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b0a10] text-white">
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
