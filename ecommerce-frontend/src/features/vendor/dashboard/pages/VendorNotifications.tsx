import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuCheckCheck, LuPackage, LuRotateCcw, LuTriangleAlert, LuWallet } from 'react-icons/lu'
import { PageHeader } from '@/features/admin/components/primitives'
import { TableTabs } from '@/features/admin/components/TableKit'
import { Button, EmptyState } from '@/shared/ui'
import { BellIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { formatDate } from '@/shared/lib/format'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useVendorNotifications, type VendorNoteKind } from '../../lib/useVendorNotifications'

const icons: Record<VendorNoteKind, typeof LuPackage> = {
  order: LuPackage,
  stock: LuTriangleAlert,
  return: LuRotateCcw,
  payout: LuWallet,
}

const iconTone: Record<VendorNoteKind, string> = {
  order: 'bg-accent-soft text-accent',
  stock: 'bg-warning-soft text-warning',
  return: 'bg-danger-soft text-danger',
  payout: 'bg-success-soft text-success',
}

type Tab = 'all' | 'unread' | VendorNoteKind

export function VendorNotifications() {
  const vendor = useCurrentVendor()
  const navigate = useNavigate()
  const { notes, unreadCount, isUnread, markRead, markAllRead } = useVendorNotifications(vendor?.id)
  const [tab, setTab] = useState<Tab>('all')

  const shown = notes.filter((n) => (tab === 'all' ? true : tab === 'unread' ? isUnread(n.id) : n.kind === tab))
  const count = (k: VendorNoteKind) => notes.filter((n) => n.kind === k).length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread · orders, stock, returns and payouts for your shop`}
        action={
          <Button variant="secondary" size="sm" disabled={unreadCount === 0} onClick={markAllRead}>
            <LuCheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <TableTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: 'All', count: notes.length },
            { value: 'unread', label: 'Unread', count: unreadCount },
            { value: 'order', label: 'Orders', count: count('order') },
            { value: 'stock', label: 'Stock', count: count('stock') },
            { value: 'return', label: 'Returns', count: count('return') },
            { value: 'payout', label: 'Payouts', count: count('payout') },
          ]}
        />

        {shown.length === 0 ? (
          <EmptyState className="mt-4" icon={<BellIcon />} title="You’re all caught up" description="New orders, stock alerts and return requests show up here." />
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {shown.map((n) => {
              const Icon = icons[n.kind]
              const unread = isUnread(n.id)
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead([n.id])
                      navigate(n.to)
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface-sunken/70',
                      unread && 'bg-accent-soft/25',
                    )}
                  >
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconTone[n.kind])}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm text-ink', unread ? 'font-semibold' : 'font-medium')}>{n.title}</span>
                      <span className="block truncate text-caption text-ink-mute">{n.body}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[11px] text-ink-mute">{n.kind === 'stock' ? 'Now' : formatDate(n.date)}</span>
                      {unread && <span className="h-2 w-2 rounded-full bg-accent" aria-label="Unread" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
