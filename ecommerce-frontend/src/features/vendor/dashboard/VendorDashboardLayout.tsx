import { Link } from 'react-router-dom'
import { DashboardShell, type NavGroup } from '@/features/admin/components/DashboardShell'
import { GridIcon, BoxIcon, ReceiptIcon, WalletIcon, StorefrontIcon, StarIcon, AlertIcon, UsersIcon } from '@/features/admin/components/icons'
import { LuGlobe, LuLogOut, LuPercent, LuRotateCcw, LuSettings, LuSlidersHorizontal, LuUser } from 'react-icons/lu'
import { Badge } from '@/shared/ui'
import { BellIcon } from '@/shared/ui/icons'
import { returnsStore } from '@/features/marketplace/stores'
import { useCurrentVendor } from '../lib/useCurrentVendor'
import { useVendorNotifications } from '../lib/useVendorNotifications'

export function VendorDashboardLayout() {
  const vendor = useCurrentVendor()
  const { unreadCount } = useVendorNotifications(vendor?.id)
  const [returns] = returnsStore.useStore()
  const openReturns = vendor ? returns.filter((r) => r.vendorId === vendor.id && r.status === 'Requested').length : 0

  const groups: NavGroup[] = [
    {
      items: [
        { label: 'Overview', to: '/vendor/dashboard', end: true, icon: GridIcon },
        { label: 'Notifications', to: '/vendor/dashboard/notifications', icon: BellIcon, badge: { count: unreadCount } },
      ],
    },
    {
      title: 'Catalog',
      items: [
        { label: 'Products', to: '/vendor/dashboard/products', icon: BoxIcon },
        { label: 'Inventory', to: '/vendor/dashboard/inventory', icon: AlertIcon },
        { label: 'Discounts', to: '/vendor/dashboard/discounts', icon: LuPercent },
      ],
    },
    {
      title: 'Sales',
      items: [
        { label: 'Orders', to: '/vendor/dashboard/orders', icon: ReceiptIcon },
        { label: 'Returns', to: '/vendor/dashboard/returns', icon: LuRotateCcw, badge: { count: openReturns, tone: 'warning' } },
        { label: 'Customers', to: '/vendor/dashboard/customers', icon: UsersIcon },
        { label: 'Reviews', to: '/vendor/dashboard/reviews', icon: StarIcon },
        { label: 'Payouts', to: '/vendor/dashboard/payouts', icon: WalletIcon },
      ],
    },
    {
      title: 'Shop',
      items: [
        { label: 'Storefront', to: '/vendor/dashboard/profile', icon: StorefrontIcon },
        { label: 'Settings', to: '/vendor/dashboard/settings', icon: LuSlidersHorizontal },
      ],
    },
  ]

  return (
    <DashboardShell
      storageKey="vendor"
      subtitle={vendor?.name ?? 'Vendor'}
      groups={groups}
      user={{ name: vendor?.name ?? 'Vendor', role: 'Shop owner' }}
      topBarActions={
        <Link
          to="/vendor/dashboard/notifications"
          aria-label={`Notifications, ${unreadCount} unread`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-ink-soft transition-colors hover:text-ink"
        >
          <BellIcon className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      }
      accountLinks={[
        { label: 'Your profile', to: '/vendor/dashboard/account', icon: LuUser },
        { label: 'Shop settings', to: '/vendor/dashboard/settings', icon: LuSettings },
        { label: 'View your shop', to: vendor ? `/vendor/${vendor.slug}` : '/', icon: LuGlobe },
        { label: 'Sign out', to: '/logout', icon: LuLogOut, tone: 'danger' },
      ]}
      accent={
        vendor && vendor.status !== 'active' ? (
          <Link to="/vendor/application" className="block rounded-2xl bg-warning-soft px-3.5 py-3 text-caption text-warning">
            <Badge tone="warning">{vendor.status === 'pending' ? 'Under review' : vendor.status}</Badge>
            <p className="mt-1 leading-snug">Storefront hidden until a curator approves it. See your application →</p>
          </Link>
        ) : null
      }
    />
  )
}
