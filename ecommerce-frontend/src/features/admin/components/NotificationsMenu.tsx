import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LuSlidersHorizontal } from 'react-icons/lu'
import { Menu } from '@/shared/ui'
import { ArrowRightIcon, BellIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { groupByDay, useNotificationFeed, type NoteKind } from '../lib/useNotificationFeed'
import { NotificationItem } from './NotificationItem'

type Filter = 'all' | 'unread' | NoteKind

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'order', label: 'Orders' },
  { value: 'stock', label: 'Stock' },
  { value: 'vendor', label: 'Vendors' },
]

export function NotificationsMenu() {
  const { notes, isUnread, markRead, markAllRead, unreadCount } = useNotificationFeed()
  const [filter, setFilter] = useState<Filter>('all')

  const shown = notes.filter((n) =>
    filter === 'all' ? true : filter === 'unread' ? isUnread(n.id) : n.kind === filter,
  )
  const groups = groupByDay(shown.slice(0, 12))

  return (
    <Menu
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Notifications, ${unreadCount} unread`}
          aria-expanded={open}
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-surface text-accent transition-colors',
            open ? 'border-accent! bg-accent-soft ring-4 ring-accent/10' : 'border-border hover:border-accent/50!',
          )}
        >
          <BellIcon className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent ring-2 ring-surface">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="w-[26rem] max-w-[calc(100vw-2.5rem)]">
          {/* header */}
          <div className="flex items-center justify-between gap-3 px-2.5 pb-3 pt-2">
            <p className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-[-0.01em] text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                  {unreadCount} new
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-caption font-semibold text-accent hover:underline">
                  Mark all read
                </button>
              )}
              <Link
                to="/admin/notifications#delivery"
                onClick={close}
                aria-label="Notification settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:border-accent/50! hover:text-accent"
              >
                <LuSlidersHorizontal className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* filters */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border px-2.5 pb-3">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'h-8 shrink-0 rounded-full border px-3 text-caption font-semibold transition-colors',
                  filter === f.value
                    ? 'border-ink! bg-ink text-bg'
                    : 'border-border-strong text-ink-soft hover:border-accent! hover:text-accent',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* list */}
          <div className="max-h-[26rem] overflow-y-auto px-1 py-2">
            {groups.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-ink-mute">You’re all caught up.</p>
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
                    {g.label}
                  </p>
                  <div className="space-y-1.5 pb-2">
                    {g.items.map((n) => (
                      <NotificationItem
                        key={n.id}
                        note={n}
                        unread={isUnread(n.id)}
                        onRead={() => markRead(n.id)}
                        onNavigate={close}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            to="/admin/notifications"
            onClick={close}
            className="flex items-center justify-center gap-1.5 border-t border-border py-3 text-sm font-semibold text-accent hover:underline"
          >
            View all notifications
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Menu>
  )
}
