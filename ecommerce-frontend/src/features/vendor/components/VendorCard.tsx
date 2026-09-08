import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Avatar, Badge } from '@/shared/ui'
import { StarIcon } from '@/shared/ui/icons'
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
        'group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow duration-[var(--dur-2)] hover:shadow-md',
        className,
      )}
    >
      <div className="relative h-24 overflow-hidden bg-surface-sunken">
        <img
          src={vendor.banner}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-105"
        />
        {vendor.status === 'pending' && (
          <span className="absolute right-2.5 top-2.5">
            <Badge tone="warning">Under review</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 items-center gap-3 p-3.5">
        <Avatar src={vendor.logo} name={vendor.name} size={44} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[0.95rem] leading-tight text-ink">{vendor.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-caption text-ink-mute">
            <span className="truncate">{vendor.location}</span>
            <StarIcon className="h-3 w-3 shrink-0 fill-accent text-accent" />
            <span className="shrink-0">{vendor.rating.toFixed(1)}</span>
            {productCount != null && <span className="shrink-0">· {productCount} pieces</span>}
          </p>
          <p className="mt-1 line-clamp-1 text-caption leading-relaxed text-ink-soft">
            {vendor.tagline}
          </p>
        </div>
      </div>
    </Link>
  )
}
