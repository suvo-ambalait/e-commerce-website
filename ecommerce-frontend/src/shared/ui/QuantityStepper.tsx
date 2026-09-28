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
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const h = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-13 bg-surface' : 'h-11'
  const btn = cn(
    'flex items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:opacity-30',
    size === 'lg' ? 'px-4' : 'px-3',
  )

  return (
    <div className={cn('inline-flex items-center rounded-full border border-border-strong', h, className)}>
      <button type="button" aria-label="Decrease quantity" className={cn(btn, 'h-full')} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <LuMinus className="h-3.5 w-3.5" />
      </button>
      <span className={cn('text-center tabular-nums text-ink', size === 'lg' ? 'min-w-9 text-base font-semibold' : 'min-w-8 text-sm')}>{value}</span>
      <button type="button" aria-label="Increase quantity" className={cn(btn, 'h-full')} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <LuPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
