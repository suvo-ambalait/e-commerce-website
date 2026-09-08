import { Link } from 'react-router-dom'
import { Menu } from '@/shared/ui'
import { BellIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useSettings } from '../context/SettingsContext'
import { summariseVendorSales } from '@/features/orders/lib/analytics'

interface Note {
  id: string
  tone: 'info' | 'warn' | 'good'
  title: string
  body: string
  to: string
}

function useNotifications(): Note[] {
  const { user } = useAuth()
  const { vendors } = useVendors()
  const { products } = useCatalog()
  const { orders } = useOrders()
  const { statusFor } = useInventory()
  const { settings } = useSettings()

  const notes: Note[] = []
  const isVendor = user?.role === 'vendor'
  const scopeId = isVendor ? user?.vendorId : undefined

  const scopedProducts = scopeId ? products.filter((p) => p.vendorId === scopeId) : products
  const low = scopedProducts.filter((p) => statusFor(p) === 'low')
  const out = scopedProducts.filter((p) => statusFor(p) === 'out')

  const scopedOrders = scopeId
    ? orders.filter((o) => o.shipments.some((s) => s.vendorId === scopeId))
    : orders
  const processing = scopedOrders.filter((o) =>
    o.shipments.some((s) => (scopeId ? s.vendorId === scopeId : true) && s.status === 'Processing'),
  )

  if (!isVendor) {
    const pending = vendors.filter((v) => v.status === 'pending')
    if (pending.length) {
      notes.push({
        id: 'pending-vendors',
        tone: 'info',
        title: `${pending.length} vendor application${pending.length > 1 ? 's' : ''}`,
        body: pending.map((v) => v.name).join(', '),
        to: '/admin/vendors',
      })
    }
  }

  if (processing.length) {
    notes.push({
      id: 'orders-processing',
      tone: 'info',
      title: `${processing.length} order${processing.length > 1 ? 's' : ''} to fulfil`,
      body: 'Awaiting shipment',
      to: isVendor ? '/vendor/dashboard/orders' : '/admin/orders',
    })
  }

  if (out.length) {
    notes.push({
      id: 'out-stock',
      tone: 'warn',
      title: `${out.length} product${out.length > 1 ? 's' : ''} out of stock`,
      body: out.slice(0, 3).map((p) => p.name).join(', '),
      to: isVendor ? '/vendor/dashboard/inventory' : '/admin/inventory',
    })
  } else if (low.length) {
    notes.push({
      id: 'low-stock',
      tone: 'warn',
      title: `${low.length} product${low.length > 1 ? 's' : ''} running low`,
      body: low.slice(0, 3).map((p) => p.name).join(', '),
      to: isVendor ? '/vendor/dashboard/inventory' : '/admin/inventory',
    })
  }

  if (isVendor && scopeId) {
    const sales = summariseVendorSales(orders, scopeId, settings.commissionRate)
    if (sales.pendingPayout > 0) {
      notes.push({
        id: 'payout',
        tone: 'good',
        title: `${formatPrice(sales.pendingPayout)} ready to withdraw`,
        body: 'From delivered shipments',
        to: '/vendor/dashboard/payouts',
      })
    }
  }

  return notes
}

const dot = {
  info: 'bg-accent',
  warn: 'bg-warning',
  good: 'bg-success',
}

export function NotificationsMenu() {
  const notes = useNotifications()

  return (
    <Menu
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Notifications, ${notes.length} new`}
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink',
            open && 'bg-surface-sunken text-ink',
          )}
        >
          <BellIcon className="h-5 w-5" />
          {notes.length > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="w-80 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between border-b border-border px-3 pb-2 pt-1">
            <p className="text-sm font-medium text-ink">Notifications</p>
            <span className="text-caption text-ink-mute">{notes.length}</span>
          </div>
          {notes.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ink-mute">You’re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {notes.map((note) => (
                <li key={note.id}>
                  <Link
                    to={note.to}
                    onClick={close}
                    className="flex gap-3 rounded-sm px-3 py-2.5 transition-colors hover:bg-surface-sunken"
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', dot[note.tone])} />
                    <span className="min-w-0">
                      <span className="block text-sm text-ink">{note.title}</span>
                      <span className="block truncate text-caption text-ink-mute">{note.body}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Menu>
  )
}
