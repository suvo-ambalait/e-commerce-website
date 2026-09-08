import { cn } from '@/shared/lib/cn'

export type CheckoutStep = 'shipping' | 'payment' | 'review'
const order: CheckoutStep[] = ['shipping', 'payment', 'review']
const labels: Record<CheckoutStep, string> = {
  shipping: 'Shipping',
  payment: 'Payment',
  review: 'Review',
}

export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const currentIndex = order.indexOf(current)
  return (
    <ol className="flex items-center gap-3 text-caption">
      {order.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-[0.7rem]',
                active && 'border-transparent bg-ink text-bg',
                done && 'border-accent bg-accent text-on-accent',
                !active && !done && 'border-border-strong text-ink-mute',
              )}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className={cn('uppercase tracking-wide', active ? 'text-ink' : 'text-ink-mute')}>
              {labels[step]}
            </span>
            {i < order.length - 1 && <span className="h-px w-8 bg-border-strong" />}
          </li>
        )
      })}
    </ol>
  )
}
