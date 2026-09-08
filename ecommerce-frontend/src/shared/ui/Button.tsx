import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group/btn relative inline-flex select-none items-center justify-center gap-2 font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-1)] ease-[var(--ease-editorial)] active:translate-y-px disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-bg shadow-sm hover:bg-ink-soft hover:shadow-md active:shadow-sm',
  secondary: 'border border-border-strong bg-surface text-ink hover:border-ink hover:bg-surface-sunken',
  ghost: 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
  link: 'text-accent underline-offset-4 hover:underline px-0! h-auto! active:translate-y-0',
  danger: 'bg-danger text-white shadow-sm hover:opacity-90 hover:shadow-md',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-caption rounded-md',
  md: 'h-11 px-6 text-sm rounded-md',
  lg: 'h-13 px-8 text-sm rounded-md',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  pill?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', pill, fullWidth, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
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
