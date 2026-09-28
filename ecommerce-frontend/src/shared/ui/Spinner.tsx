import { cn } from '@/shared/lib/cn'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'

const sizes: Record<SpinnerSize, number> = { xs: 12, sm: 14, md: 16, lg: 20 }

export interface SpinnerProps {
  /** preset name or pixel size */
  size?: SpinnerSize | number
  className?: string
  /** accessible label; omit when the parent already announces loading (e.g. aria-busy button) */
  label?: string
}

/**
 * Ring spinner: a faint full track plus a bright arc that rotates while its
 * length "breathes". Uses currentColor, so it matches whatever text color it sits in.
 */
export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  const px = typeof size === 'number' ? size : sizes[size]
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('shrink-0 animate-spin [animation-duration:0.8s]', className)}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={100}
        className="spin-arc"
      />
    </svg>
  )
}
