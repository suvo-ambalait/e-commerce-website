import { Link } from 'react-router-dom'
import { LuMapPin } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { Avatar, Badge } from '@/shared/ui'
import { ArrowRightIcon, StarIcon } from '@/shared/ui/icons'
import type { Vendor } from '@/shared/types'

export function VendorCard({
  vendor,
  productCount,
  className,
}: {
  vendor: Vendor
  productCount?: number
  className?: string
}) {
  return (
    <Link
      to={`/vendor/${vendor.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-[box-shadow,transform,border-color] duration-300 ease-editorial hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_40px_rgba(40,20,80,0.12)]',
        className,
      )}
    >
      {/* banner */}
      <div className="relative h-28 bg-accent-soft">
        <div className="h-full overflow-hidden">
          <img
            src={vendor.banner}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
          />
        </div>

        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm backdrop-blur">
          <LuMapPin className="h-3 w-3 text-accent" aria-hidden />
          {vendor.location}
        </span>
        {vendor.status === 'pending' && (
          <span className="absolute left-2.5 top-2.5">
            <Badge tone="warning">Under review</Badge>
          </span>
        )}

        <Avatar
          src={vendor.logo}
          name={vendor.name}
          size={48}
          className="absolute -bottom-6 left-4 ring-4 ring-surface"
        />
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-9">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate font-display text-lg font-bold tracking-[-0.01em] text-ink">{vendor.name}</p>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-caption font-semibold text-ink tabular-nums">
            <StarIcon className="h-3 w-3 fill-accent text-accent" />
            {vendor.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-caption leading-relaxed text-ink-soft">{vendor.tagline}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-caption">
          <span className="text-ink-mute">
            {productCount != null && `${productCount} ${productCount === 1 ? 'piece' : 'pieces'}`}
          </span>
          <span className="flex items-center gap-1 font-semibold text-accent">
            Visit shop
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
