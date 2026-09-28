import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { LuEye, LuEyeOff } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { ArrowRightIcon, StoreIcon } from '@/shared/ui/icons'

/**
 * Presentational building blocks for the auth pages (sign in, forgot, verify,
 * reset). No auth logic lives here — pages own their state and handlers.
 */

/** Lavender page with faint rings and a centred white card. */
export function AuthShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-surface-sunken/50 px-4 py-12 md:py-16">
      {/* decorative rings — `!` beats the global `* { border-color }` rule in index.css */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-112 w-112 rounded-full border border-accent/15!" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-112 w-112 rounded-full border border-accent/15!" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative mx-auto w-full max-w-md"
      >
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(40,20,80,0.08)] sm:p-8">
          {children}
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </motion.div>
    </section>
  )
}

/** Big display title (wrap accent words in <em>) with a supporting line. */
export function AuthTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div>
      {/* `!` beats the global unlayered h1 font rule in index.css */}
      <h1 className="font-display! text-[2.5rem] font-extrabold! leading-none tracking-[-0.04em]! text-ink [&_em]:font-medium [&_em]:text-accent">
        {children}
      </h1>
      {subtitle && <p className="mt-2.5 text-sm text-ink-soft">{subtitle}</p>}
    </div>
  )
}

/** Labelled input with a leading icon, optional label-row link and password eye toggle. */
export function AuthField({
  label,
  icon,
  labelAside,
  type = 'text',
  className,
  ...input
}: {
  label: string
  icon: ReactNode
  labelAside?: ReactNode
} & InputHTMLAttributes<HTMLInputElement>) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const id = input.id ?? `auth-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-border-strong bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent! focus-within:ring-4 focus-within:ring-accent/15">
        <span className="shrink-0 text-ink-mute">{icon}</span>
        <input
          {...input}
          id={id}
          type={isPassword && reveal ? 'text' : type}
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-ink-mute focus:ring-0"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="shrink-0 text-ink-mute transition-colors hover:text-accent"
          >
            {reveal ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

/** Full-width purple pill with a white arrow circle. */
export function AuthSubmit({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group flex h-13 w-full items-center justify-between rounded-full bg-accent pl-6 pr-1.5 text-sm font-semibold text-on-accent shadow-[0_10px_28px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:shadow-none"
    >
      {children}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6d28d9]">
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

/** Custom checkbox row ("Keep me signed in"). */
export function AuthCheckbox({
  label,
  checked,
  onChange,
}: {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-soft">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={cn(
          'flex h-4.5 w-4.5 items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40',
          checked ? 'border-accent! bg-accent text-on-accent' : 'border-border-strong bg-surface',
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M2.5 6.2 5 8.5l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  )
}

/** "Want to sell on AmbalaEshop?" card shown under the sign-in card. */
export function SellPrompt() {
  return (
    <Link
      to="/vendor/signup"
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-sm transition-colors hover:border-accent/50!"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <StoreIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 text-sm text-ink-soft">Want to sell on AmbalaEshop?</span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent">
        Apply now
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
