import type { ReactNode } from 'react'
import { LuMinus, LuPlus } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'

/** Rounded quantity stepper with circular −/+ buttons (cart drawer + cart page). */
export function PillStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}) {
  return (
    <div className={cn('inline-flex h-8 items-center gap-1 rounded-full border border-border-strong p-0.5', className)}>
      <StepButton label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <LuMinus className="h-3 w-3" />
      </StepButton>
      <span className="min-w-5 text-center text-sm font-semibold text-ink tabular-nums">{value}</span>
      <StepButton label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <LuPlus className="h-3 w-3" />
      </StepButton>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
