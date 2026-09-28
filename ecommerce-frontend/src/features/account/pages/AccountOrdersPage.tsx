import { useState } from 'react'
import { LuPackage } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ButtonLink, EmptyState } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { AccountCard } from '../components/AccountLayout'
import { OrderCard } from '../components/OrderCard'
import { orderProgress, useCustomer, type OrderProgress } from '../lib/useCustomer'

type Tab = 'all' | 'active' | 'Delivered' | 'Cancelled'

const tabs: { value: Tab; label: string; match: (p: OrderProgress) => boolean }[] = [
  { value: 'all', label: 'All', match: () => true },
  { value: 'active', label: 'In progress', match: (p) => p === 'Processing' || p === 'On the way' },
  { value: 'Delivered', label: 'Delivered', match: (p) => p === 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled', match: (p) => p === 'Cancelled' },
]

export function AccountOrdersPage() {
  useDocumentTitle('Your orders · AmbalaEshop')
  const { orders } = useCustomer()
  const [tab, setTab] = useState<Tab>('all')

  const current = tabs.find((t) => t.value === tab)!
  const shown = orders.filter((o) => current.match(orderProgress(o)))

  return (
    <AccountCard title="Your orders" subtitle="Each shop sends its own parcel, so one order can arrive in several boxes.">
      <div role="tablist" className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => {
          const count = orders.filter((o) => t.match(orderProgress(o))).length
          const active = tab === t.value
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                active ? 'bg-ink text-bg' : 'bg-surface-sunken text-ink-soft hover:text-ink',
              )}
            >
              {t.label}
              <span className={cn('text-caption tabular-nums', active ? 'text-bg/70' : 'text-ink-mute')}>{count}</span>
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<LuPackage />}
          title={orders.length === 0 ? 'No orders yet' : 'Nothing here'}
          description={orders.length === 0 ? 'When you buy something, you can follow it here.' : 'No orders match this filter.'}
          action={orders.length === 0 ? <ButtonLink to="/shop">Start shopping</ButtonLink> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {shown.map((o) => (
            <OrderCard key={o.orderNumber} order={o} />
          ))}
        </div>
      )}
    </AccountCard>
  )
}
