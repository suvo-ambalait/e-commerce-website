import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { contentStore } from '@/features/marketplace/stores'

/** Promo banners managed on the admin Site content page. Renders nothing when none are active. */
export function PromoBanners() {
  const [content] = contentStore.useStore()
  const banners = content.banners.filter((b) => b.active)
  if (banners.length === 0) return null

  return (
    <section className="container-page py-6">
      <div className={cn('grid gap-4', banners.length > 1 && 'md:grid-cols-2')}>
        {banners.map((b, i) => (
          <Link
            key={b.id}
            to={b.link || '/shop'}
            className={cn(
              'group relative flex min-h-40 items-end overflow-hidden rounded-3xl p-6 text-white sm:p-8',
              i % 2 === 0 ? 'bg-linear-to-br from-[#6d28d9] to-[#a78bfa]' : 'bg-[#0b0a10]',
            )}
          >
            {b.image && <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-105" />}
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/20!" />
            <div className="relative">
              <p className="font-display text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">{b.title}</p>
              {b.subtitle && <p className="mt-1 text-sm text-white/80">{b.subtitle}</p>}
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                Shop now
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
