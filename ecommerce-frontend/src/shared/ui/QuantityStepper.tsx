import { LuMinus, LuPlus } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  className,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const h = size === 'sm' ? 'h-9' : 'h-11'
  const btn = 'flex items-center justify-center px-3 text-ink-soft transition-colors hover:text-ink disabled:opacity-30'

  return (
    <div className={cn('inline-flex items-center rounded-sm border border-border-strong', h, className)}>
      <button type="button" aria-label="Decrease quantity" className={cn(btn, 'h-full')} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <LuMinus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-8 text-center text-sm tabular-nums text-ink">{value}</span>
      <button type="button" aria-label="Increase quantity" className={cn(btn, 'h-full')} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <LuPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
