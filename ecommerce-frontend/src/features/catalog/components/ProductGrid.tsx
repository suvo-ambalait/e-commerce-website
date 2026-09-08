import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/ui'
import { ProductCard } from './ProductCard'
import type { Product } from '@/shared/types'

const gridCols = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
}

export function ProductGrid({
  products,
  columns = 4,
  className,
}: {
  products: Product[]
  columns?: 2 | 3 | 4
  className?: string
}) {
  return (
    <div className={cn('grid gap-x-4 gap-y-7 sm:gap-x-5', gridCols[columns], className)}>
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          className="rise"
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
        />
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 2 | 3 | 4 }) {
  return (
    <div className={cn('grid gap-x-4 gap-y-7 sm:gap-x-5', gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[5/6] w-full rounded-lg" />
          <Skeleton className="mt-3 h-3 w-1/3" />
          <Skeleton className="mt-2 h-3.5 w-2/3" />
          <Skeleton className="mt-2 h-3.5 w-1/4" />
        </div>
      ))}
    </div>
  )
}
