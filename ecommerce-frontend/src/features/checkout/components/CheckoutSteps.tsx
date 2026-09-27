import type { ReactNode } from 'react'
import { CheckIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'

export type CheckoutStep = 'cart' | 'details' | 'payment'

const order: CheckoutStep[] = ['cart', 'details', 'payment']
const labels: Record<CheckoutStep, string> = { cart: 'Cart', details: 'Details', payment: 'Payment' }

/**
 * Cart → Details → Payment progress. Completed steps are clickable when
 * `onStepClick` is given, so shoppers can jump back.
 */
export function CheckoutSteps({
  current,
  onStepClick,
}: {
  current: CheckoutStep
  onStepClick?: (step: CheckoutStep) => void
}) {
  const currentIndex = order.indexOf(current)

  return (
    <ol className="flex items-center gap-2 text-sm">
      {order.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const content = (
          <>
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                active && 'bg-accent text-on-accent shadow-[0_6px_16px_rgba(109,40,217,0.35)]',
                done && 'bg-accent-soft text-accent',
                !active && !done && 'border border-border-strong text-ink-mute',
              )}
            >
              {done ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn('font-semibold', active || done ? 'text-ink' : 'text-ink-mute')}>{labels[step]}</span>
          </>
        )
        return (
          <li key={step} className="flex items-center gap-2">
            {done && onStepClick ? (
              <button
                type="button"
                onClick={() => onStepClick(step)}
                className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-75"
              >
                {content}
              </button>
            ) : (
              <span className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
                {content}
              </span>
            )}
            {i < order.length - 1 && (
              <span className={cn('h-px w-6 sm:w-10', done ? 'bg-accent' : 'bg-border-strong')} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** Big display title with a subtitle on the left and the step indicator on the right. */
export function CheckoutHeader({
  title,
  subtitle,
  steps,
}: {
  title: ReactNode
  subtitle?: ReactNode
  steps: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {/* `!` beats the global unlayered h1 font rule in index.css */}
        <h1 className="font-display! text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] font-extrabold! leading-none tracking-[-0.04em]! text-ink [&_em]:font-medium [&_em]:text-accent">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-ink-mute">{subtitle}</p>}
      </div>
      {steps}
    </div>
  )
}
