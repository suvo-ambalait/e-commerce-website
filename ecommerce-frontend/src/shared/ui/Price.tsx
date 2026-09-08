import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'

export function Price({
  value,
  originalPrice,
  size = 'md',
  className,
}: {
  value: number
  originalPrice?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const onSale = originalPrice != null && originalPrice > value
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={cn('font-medium tabular-nums text-ink', sizes[size], onSale && 'text-sale')}>
        {formatPrice(value)}
      </span>
      {onSale && (
        <span className={cn('tabular-nums text-ink-mute line-through', size === 'lg' ? 'text-base' : 'text-caption')}>
          {formatPrice(originalPrice)}
        </span>
      )}
    </span>
  )
}
