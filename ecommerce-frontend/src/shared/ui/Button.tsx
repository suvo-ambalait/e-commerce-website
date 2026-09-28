import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group/btn relative inline-flex select-none items-center justify-center gap-2 font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-1)] ease-[var(--ease-editorial)] active:translate-y-px disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-bg shadow-sm hover:bg-ink-soft hover:shadow-md active:shadow-sm',
  secondary: 'border border-border-strong bg-surface text-ink hover:border-accent hover:text-accent',
  ghost: 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
  link: 'text-accent underline-offset-4 hover:underline px-0! h-auto! active:translate-y-0',
  danger: 'bg-danger text-white shadow-sm hover:opacity-90 hover:shadow-md',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-caption font-semibold rounded-xl',
  md: 'h-11 px-6 text-sm font-semibold rounded-xl',
  lg: 'h-13 px-8 text-sm font-semibold rounded-xl',
}

const spinnerSizes: Record<Size, number> = { sm: 14, md: 16, lg: 18 }

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  pill?: boolean
  fullWidth?: boolean
  /** shows an in-button spinner + shimmer, disables the button, keeps its width */
  loading?: boolean
  /** optional text shown beside the spinner while loading, e.g. "Saving…" */
  loadingText?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    pill,
    fullWidth,
    loading = false,
    loadingText,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        pill && 'rounded-full!',
        fullWidth && 'w-full',
        loading && 'overflow-hidden cursor-wait disabled:opacity-100!',
        className,
      )}
      {...props}
    >
      {/* label stays in the DOM so the button width never jumps */}
      <span
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 ease-out',
          loading && '-translate-y-1 opacity-0',
        )}
      >
        {children}
      </span>

      {/* spinner (+ optional text) fades in on top */}
      <span
        aria-hidden={!loading}
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 ease-out',
          loading ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-90 opacity-0',
        )}
      >
        {loading && (
          <>
            <Spinner size={spinnerSizes[size]} />
            {loadingText && <span>{loadingText}</span>}
          </>
        )}
      </span>

      {/* soft light sweep */}
      {loading && <span aria-hidden className="btn-shimmer pointer-events-none absolute inset-0" />}
    </button>
  )
})

export type ButtonLinkProps = LinkProps & {
  variant?: Variant
  size?: Size
  pill?: boolean
  fullWidth?: boolean
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  pill,
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        base,
        variants[variant],
        sizes[size],
        pill && 'rounded-full!',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
