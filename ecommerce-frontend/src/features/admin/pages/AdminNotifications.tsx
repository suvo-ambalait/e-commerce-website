import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LuArrowLeft, LuCheckCheck, LuPackage, LuStar, LuStore, LuTriangleAlert } from 'react-icons/lu'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { cn } from '@/shared/lib/cn'
import { SearchIcon } from '@/shared/ui/icons'
import { PageHeader, Panel } from '../components/primitives'
import { NotificationItem } from '../components/NotificationItem'
import { groupByDay, useNotificationFeed, type NoteKind } from '../lib/useNotificationFeed'

type Filter = 'all' | 'unread' | NoteKind

const kinds: { kind: NoteKind; label: string; icon: typeof LuPackage; tone: string }[] = [
  { kind: 'order', label: 'Orders', icon: LuPackage, tone: 'bg-accent-soft text-accent' },
  { kind: 'stock', label: 'Stock alerts', icon: LuTriangleAlert, tone: 'bg-warning-soft text-warning' },
  { kind: 'vendor', label: 'Vendors', icon: LuStore, tone: 'bg-accent-soft text-accent' },
  { kind: 'review', label: 'Reviews', icon: LuStar, tone: 'bg-surface-sunken text-ink-soft' },
]

type Delivery = Record<NoteKind, { email: boolean; push: boolean }>
const defaultDelivery: Delivery = {
  order: { email: true, push: true },
  stock: { email: true, push: true },
  vendor: { email: true, push: false },
  review: { email: false, push: false },
}

export function AdminNotifications() {
  const { notes, isUnread, markRead, markAllRead, unreadCount } = useNotificationFeed()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [delivery, setDelivery] = usePersistedState<Delivery>('admin:notes-delivery', defaultDelivery)
  const { hash } = useLocation()

  // the bell menu's settings button links to #delivery
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const counts: Record<Filter, number> = {
    all: notes.length,
    unread: unreadCount,
    order: notes.filter((n) => n.kind === 'order').length,
    stock: notes.filter((n) => n.kind === 'stock').length,
    vendor: notes.filter((n) => n.kind === 'vendor').length,
    review: notes.filter((n) => n.kind === 'review').length,
  }

  const needle = q.trim().toLowerCase()
  const shown = notes
    .filter((n) => (filter === 'all' ? true : filter === 'unread' ? isUnread(n.id) : n.kind === filter))
    .filter((n) => !needle || `${n.title} ${n.body}`.toLowerCase().includes(needle))
  const groups = groupByDay(shown)

  const tabs: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'order', label: 'Orders' },
    { value: 'stock', label: 'Stock' },
    { value: 'vendor', label: 'Vendors' },
    { value: 'review', label: 'Reviews' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread · orders, stock and shop activity in one place`}
        action={
          <>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50! disabled:opacity-50"
            >
              <LuCheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
            <Link
              to="/admin"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              <LuArrowLeft className="h-4 w-4" />
              Back to overview
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr] xl:items-start">
        {/* feed */}
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter notifications">
              {tabs.map((t) => {
                const on = filter === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setFilter(t.value)}
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-full border px-3 text-caption font-semibold transition-colors',
                      on ? 'border-ink! bg-ink text-bg' : 'border-border-strong text-ink-soft hover:border-accent! hover:text-accent',
                    )}
                  >
                    {t.label}
                    <span className={cn('tabular-nums', on ? 'text-[#a78bfa]' : 'text-ink-mute')}>{counts[t.value]}</span>
                  </button>
                )
              })}
            </div>
            <label className="flex h-9 w-full items-center gap-2 rounded-xl border border-border-strong px-3 focus-within:border-accent! sm:w-56">
              <SearchIcon className="h-3.5 w-3.5 shrink-0 text-ink-mute" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notifications"
                aria-label="Search notifications"
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-caption text-ink outline-none placeholder:text-ink-mute focus:ring-0"
              />
            </label>
          </div>

          {groups.length === 0 ? (
            <p className="py-14 text-center text-sm text-ink-mute">
              {needle ? `Nothing matches “${q.trim()}”.` : 'You’re all caught up.'}
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="pt-4">
                <p className="pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">{g.label}</p>
                <div className="space-y-1.5">
                  {g.items.map((n) => (
                    <NotificationItem
                      key={n.id}
                      note={n}
                      unread={isUnread(n.id)}
                      onRead={() => markRead(n.id)}
                      variant="page"
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </Panel>

        {/* sidebar */}
        <div className="space-y-4 xl:sticky xl:top-6">
          <Panel>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-caption font-semibold text-ink-soft">Unread</p>
                <p className="font-display text-[2.4rem] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                  {unreadCount}
                </p>
              </div>
              <p className="text-caption text-ink-mute">of {notes.length} total</p>
            </div>
            <ul className="mt-4 space-y-1 border-t border-border pt-3">
              {kinds.map(({ kind, label, icon: Icon, tone }) => {
                const fresh = notes.filter((n) => n.kind === kind && isUnread(n.id)).length
                return (
                  <li key={kind}>
                    <button
                      type="button"
                      onClick={() => setFilter(kind)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-sunken"
                    >
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', tone)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 font-medium text-ink">{label}</span>
                      {fresh > 0 && (
                        <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          {fresh} new
                        </span>
                      )}
                      <span className="w-6 text-right font-semibold text-ink tabular-nums">{counts[kind]}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <div id="delivery" className="scroll-mt-6">
            <Panel title="Delivery" subtitle="Choose where each alert reaches you. Saved in this browser.">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-5 gap-y-3 text-sm">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">Type</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">Email</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">Push</span>
                {kinds.map(({ kind, label }) => (
                  <DeliveryRow
                    key={kind}
                    label={label}
                    value={delivery[kind] ?? defaultDelivery[kind]}
                    onChange={(next) => setDelivery((prev) => ({ ...prev, [kind]: next }))}
                  />
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeliveryRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: { email: boolean; push: boolean }
  onChange: (next: { email: boolean; push: boolean }) => void
}) {
  return (
    <>
      <span className="font-medium text-ink">{label}</span>
      <Toggle label={`${label} by email`} on={value.email} onChange={(email) => onChange({ ...value, email })} />
      <Toggle label={`${label} push`} on={value.push} onChange={(push) => onChange({ ...value, push })} />
    </>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        'relative h-6 w-10 rounded-full transition-colors',
        on ? 'bg-accent' : 'bg-border-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left]',
          on ? 'left-[1.125rem]' : 'left-0.5',
        )}
      />
    </button>
  )
}
