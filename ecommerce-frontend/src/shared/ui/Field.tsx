import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import { LuCheck } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'

const control =
  'field-focus w-full rounded-md border border-border-strong bg-surface px-3.5 text-sm text-ink placeholder:text-ink-mute transition-[color,border-color,box-shadow] duration-[var(--dur-1)] outline-none hover:border-ink-mute disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-sunken aria-invalid:border-danger aria-invalid:shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_16%,transparent)]'

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-caption font-medium tracking-wide text-ink-soft">
      {children}
    </label>
  )
}

interface WrapProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: (id: string) => ReactNode
}

export function Field({ label, hint, error, required, className, children }: WrapProps) {
  const id = useId()
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <FieldLabel htmlFor={id}>
          {label}
          {required && <span className="text-accent"> *</span>}
        </FieldLabel>
      )}
      {children(id)}
      {error ? (
        <p className="mt-1 text-caption text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-caption text-ink-mute">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(control, 'h-11', className)} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(control, 'py-2.5 leading-relaxed', className)} {...props} />
  },
)

/* ---------------------------- checkbox --------------------------- */

interface CheckProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: ReactNode
}

export function Checkbox({ label, className, checked, ...props }: CheckProps) {
  return (
    <label className={cn('group flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-soft', className)}>
      <span className="relative inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-[5px] border border-border-strong bg-surface transition-colors checked:border-ink checked:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-40"
          {...props}
        />
        <LuCheck className="pointer-events-none h-3 w-3 scale-50 text-bg opacity-0 transition-all duration-[var(--dur-1)] peer-checked:scale-100 peer-checked:opacity-100" />
      </span>
      <span className="transition-colors group-hover:text-ink">{label}</span>
    </label>
  )
}

export function Radio({ label, className, ...props }: CheckProps) {
  return (
    <label className={cn('group flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-soft', className)}>
      <span className="relative inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center">
        <input
          type="radio"
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-full border border-border-strong bg-surface transition-colors checked:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-40"
          {...props}
        />
        <span className="pointer-events-none h-2 w-2 scale-0 rounded-full bg-ink transition-transform duration-[var(--dur-1)] peer-checked:scale-100" />
      </span>
      <span className="transition-colors group-hover:text-ink">{label}</span>
    </label>
  )
}

/* ----------------------------- switch ---------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  className,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <label className={cn('flex cursor-pointer select-none items-center gap-3 text-sm text-ink-soft', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full border transition-colors duration-[var(--dur-1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-40',
          checked ? 'border-ink bg-ink' : 'border-border-strong bg-surface-sunken',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface shadow-sm transition-transform duration-[var(--dur-1)]',
            checked ? 'translate-x-4.5' : 'translate-x-0.5',
          )}
        />
      </button>
      {label}
    </label>
  )
}
