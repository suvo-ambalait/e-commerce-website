import { LuStar } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'

export function Rating({
  value,
  count,
  size = 'sm',
  showValue = false,
  className,
}: {
  value: number
  count?: number
  size?: 'sm' | 'md'
  showValue?: boolean
  className?: string
}) {
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-caption text-ink-mute', className)}>
      <span className="inline-flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i))
          return (
            <span key={i} className={cn('relative', px)}>
              <LuStar className={cn(px, 'absolute inset-0 fill-border-strong text-border-strong')} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <LuStar className={cn(px, 'fill-accent text-accent')} />
              </span>
            </span>
          )
        })}
      </span>
      {showValue && <span className="tabular-nums text-ink-soft">{value.toFixed(1)}</span>}
      {count != null && <span>({count})</span>}
      <span className="sr-only">{value.toFixed(1)} out of 5 stars</span>
    </span>
  )
}
