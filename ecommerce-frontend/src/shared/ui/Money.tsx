import { cn } from '@/shared/lib/cn'
import { formatPrice, formatPriceParts } from '@/shared/lib/format'

/**
 * A price with a slightly smaller, lighter currency sign, so large display
 * numbers read as the amount first. Screen readers get the plain formatted price.
 */
export function Money({ value, className }: { value: number; className?: string }) {
  const { symbol, amount } = formatPriceParts(value)
  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      <span className="sr-only">{formatPrice(value)}</span>
      <span aria-hidden="true">
        <span className="mr-[0.06em] align-[0.12em] font-sans text-[0.7em] font-semibold opacity-70">{symbol}</span>
        {amount}
      </span>
    </span>
  )
}
