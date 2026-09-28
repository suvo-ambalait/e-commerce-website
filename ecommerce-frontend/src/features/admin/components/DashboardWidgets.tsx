import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { IconType } from 'react-icons'
import { Avatar } from '@/shared/ui'
import { ArrowRightIcon, CheckIcon, ChevronRightIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'

/**
 * Building blocks shared by the admin and vendor overview dashboards.
 * Presentational only — pages compute the numbers and pass them in.
 */

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (days < 30) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

/** Small accent link for a panel's top-right corner. */
export function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-caption font-semibold text-accent hover:underline">
      {children}
      <ArrowRightIcon className="h-3 w-3" />
    </Link>
  )
}

/** Bordered "see all" button used above tables. */
export function SectionButtonLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-caption font-semibold text-ink transition-colors hover:border-accent/50! hover:text-accent"
    >
      {children}
      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

/** "Recent orders (12)" heading with a subtitle and an action on the right. */
export function SectionHeader({
  title,
  count,
  subtitle,
  action,
}: {
  title: string
  count?: number
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h3 className="flex items-center gap-2 font-display! text-base font-bold! tracking-[-0.01em]! text-ink">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-sans text-[11px] font-semibold text-accent tabular-nums">
              {count}
            </span>
          )}
        </h3>
        {subtitle && <p className="mt-0.5 text-caption text-ink-mute">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** ▲ 12% / ▼ 4% pill. Renders nothing when the change is unknown. */
export function ChangeBadge({ change }: { change: number | null }) {
  if (change === null || !Number.isFinite(change)) return null
  const up = change >= 0
  return (
    <span
      className={cn(
        'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(change * 100).toFixed(0)}%
    </span>
  )
}

/** Big latest value + change badge + date, for a chart panel's corner. */
export function LatestValue({ value, label, change }: { value: string; label: string; change: number | null }) {
  return (
    <div className="text-right">
      <p className="font-display text-2xl font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">{value}</p>
      <p className="mt-1.5 flex items-center justify-end gap-1.5 text-caption text-ink-mute">
        <ChangeBadge change={change} />
        {label}
      </p>
    </div>
  )
}

const dayName: Record<string, string> = {
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
}

function joinDays(labels: string[], short: boolean) {
  const names = labels.map((l) => (short ? l : (dayName[l] ?? l)))
  return names.length <= 2 ? names.join(' & ') : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

/** Busiest / quietest days from weekday buckets, tie-aware. */
export function weekdayInsights(bars: { label: string; value: number }[]) {
  const max = Math.max(0, ...bars.map((d) => d.value))
  const min = Math.min(...bars.map((d) => d.value))
  const busiest = bars.filter((d) => d.value === max).map((d) => d.label)
  const quietest = bars.filter((d) => d.value === min).map((d) => d.label)
  const total = bars.reduce((n, d) => n + d.value, 0)
  return {
    total,
    subtitle: max === 0 ? 'No orders yet' : `${joinDays(busiest, false)} ${busiest.length > 1 ? 'are' : 'is'} busiest`,
    busiestShort: max ? joinDays(busiest, true) : '—',
    quietestShort: max ? joinDays(quietest, true) : '—',
  }
}

/** Grey strip of 2–4 small labelled figures under a chart. */
export function SummaryStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl
      className="mt-5 grid divide-x divide-border rounded-xl bg-surface-sunken/60 py-3 text-center"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((s) => (
        <div key={s.label} className="min-w-0 px-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-mute">{s.label}</dt>
          <dd className="mt-1 truncate font-display text-sm font-bold text-ink tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** "3 open" / "Clear" pill for the Needs attention panel. */
export function OpenCountPill({ open }: { open: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums',
        open ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', open ? 'bg-warning' : 'bg-success')} />
      {open ? `${open} open` : 'Clear'}
    </span>
  )
}

const attentionTone = {
  warning: { card: 'hover:border-warning/50!', bar: 'bg-warning', icon: 'bg-warning-soft text-warning' },
  accent: { card: 'hover:border-accent/50!', bar: 'bg-accent', icon: 'bg-accent-soft text-accent' },
  info: { card: 'hover:border-ink-mute/50!', bar: 'bg-ink-soft', icon: 'bg-surface-sunken text-ink-soft' },
}

/** One task card: tone stripe, icon, big count, title, hint and optional meta row. */
export function AttentionRow({
  to,
  tone,
  icon,
  count,
  title,
  text,
  meta,
}: {
  to: string
  tone: keyof typeof attentionTone
  icon: ReactNode
  count: number
  title: string
  text: string
  meta?: ReactNode
}) {
  const t = attentionTone[tone]
  return (
    <Link
      to={to}
      className={cn(
        'group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-3.5 pl-4 transition-[border-color,box-shadow] hover:shadow-[0_10px_24px_rgba(40,20,80,0.08)]',
        t.card,
      )}
    >
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', t.bar)} />
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', t.icon)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className="font-display text-lg font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums">
            {count}
          </span>
          <span className="truncate text-sm font-semibold text-ink">{title}</span>
        </span>
        <span className="mt-1 block text-caption text-ink-mute">{text}</span>
        {meta && <span className="mt-2.5 flex flex-wrap items-center gap-1.5">{meta}</span>}
      </span>
      <span className="mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-mute transition-colors group-hover:bg-ink group-hover:text-bg">
        <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-px" />
      </span>
    </Link>
  )
}

/** Green "All clear" card for when no task is open. */
export function AllClear({ text = 'Nothing needs you right now.' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-success/40! bg-success-soft/50 px-4 py-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-white shadow-[0_8px_20px_rgba(34,120,60,0.25)]">
        <CheckIcon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">All clear</p>
      <p className="mt-0.5 text-caption text-ink-mute">{text}</p>
    </div>
  )
}

/** Overlapping thumbnails with a "+N" overflow chip. */
export function ThumbStack({
  items,
  rounded,
  max = 4,
}: {
  items: { key: string; src?: string; name: string }[]
  rounded: string
  max?: number
}) {
  return (
    <span className="mr-1 flex -space-x-1.5">
      {items.slice(0, max).map((i) =>
        i.src ? (
          <img
            key={i.key}
            src={i.src}
            alt={i.name}
            title={i.name}
            className={cn('h-6 w-6 object-cover ring-2 ring-surface', rounded)}
          />
        ) : (
          <Avatar key={i.key} name={i.name} size={24} className="ring-2 ring-surface" />
        ),
      )}
      {items.length > max && (
        <span
          className={cn(
            'flex h-6 min-w-6 items-center justify-center bg-surface-sunken px-1 text-[10px] font-semibold text-ink-soft ring-2 ring-surface',
            rounded,
          )}
        >
          +{items.length - max}
        </span>
      )}
    </span>
  )
}

export function MetaChip({ tone, children }: { tone: 'warning' | 'danger'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning',
      )}
    >
      {children}
    </span>
  )
}

/** 2×2 grid of icon tiles pinned to the bottom of a flex-column panel. */
export function QuickActions({ actions }: { actions: { label: string; hint: string; to: string; icon: IconType }[] }) {
  return (
    <div className="mt-auto pt-6">
      <p className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
        Quick actions
        <span className="h-px flex-1 bg-border" />
      </p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ label, hint, to, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="group flex items-center gap-2.5 rounded-xl border border-border bg-surface p-2.5 transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-accent/50! hover:shadow-[0_8px_20px_rgba(40,20,80,0.08)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-caption font-semibold text-ink">{label}</span>
              <span className="block truncate text-[11px] text-ink-mute">{hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Order-number cell: receipt tile + number + item count. */
export function OrderCell({ to, orderNumber, items, icon: Icon }: { to?: string; orderNumber: string; items: number; icon: IconType }) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/15 transition-colors group-hover/order:bg-accent group-hover/order:text-on-accent">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink tabular-nums transition-colors group-hover/order:text-accent">
          {orderNumber}
        </span>
        <span className="block text-caption text-ink-mute">
          {items} item{items === 1 ? '' : 's'}
        </span>
      </span>
    </>
  )
  return to ? (
    <Link to={to} className="group/order flex items-center gap-3">
      {body}
    </Link>
  ) : (
    <span className="group/order flex items-center gap-3">{body}</span>
  )
}

/** Date + relative time, two lines. */
export function DateCell({ iso, format }: { iso: string; format: (iso: string) => string }) {
  return (
    <span>
      <span className="block text-ink">{format(iso)}</span>
      <span className="block text-caption text-ink-mute">{timeAgo(iso)}</span>
    </span>
  )
}

/** Initials avatar + name + email. */
export function CustomerCell({ name, email }: { name?: string; email: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <Avatar name={name || email} size={32} className="bg-accent-soft! text-accent!" />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink">{name || 'Guest'}</span>
        <span className="block truncate text-caption text-ink-mute">{email}</span>
      </span>
    </span>
  )
}
