import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'sm' | 'md'
  variant?: 'plain' | 'surface'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', variant = 'plain', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full text-ink-soft transition-colors duration-[var(--dur-1)] hover:text-ink disabled:opacity-40',
        size === 'sm' ? 'h-9 w-9' : 'h-10 w-10',
        variant === 'surface' && 'bg-surface shadow-sm hover:bg-surface-sunken',
        className,
      )}
      {...props}
    />
  )
})
