import { Link } from 'react-router-dom'
import { LuArrowUpRight } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import type { Category } from '@/shared/types'

/** Image tile + name / count row with a round arrow; hover outlines the image in violet. */
export function CategoryCard({
  category,
  count,
  showDescription = false,
  className,
}: {
  category: Category
  count: number
  showDescription?: boolean
  className?: string
}) {
  return (
    <Link to={`/shop?category=${encodeURIComponent(category.name)}`} className={cn('group block', className)}>
      <div className="aspect-4/3 overflow-hidden rounded-2xl border-2 border-transparent bg-accent-soft transition-colors duration-300 group-hover:border-accent group-focus-visible:border-accent">
        <img
          src={category.image}
          alt=""
          loading="lazy"
          className="h-full w-full rounded-[14px] object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold tracking-[-0.01em] text-ink transition-colors group-hover:text-accent">
            {category.name}
          </p>
          <p className="text-caption text-ink-mute">
            {count} {count === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-strong text-ink transition-colors duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
          <LuArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </div>

      {showDescription && (
        <p className="mt-2 line-clamp-2 px-0.5 text-sm text-ink-soft">{category.description}</p>
      )}
    </Link>
  )
}
