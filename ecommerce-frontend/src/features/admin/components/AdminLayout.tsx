import { Link } from 'react-router-dom'
import {
  LuChartLine,
  LuExternalLink,
  LuGlobe,
  LuKeyRound,
  LuLayoutTemplate,
  LuLogOut,
  LuRotateCcw,
  LuSettings,
  LuShieldCheck,
  LuTruck,
  LuUser,
  LuUsers,
  LuWallet,
} from 'react-icons/lu'
import { messagesStore, payoutRequestsStore, returnsStore } from '@/features/marketplace/stores'
import { DashboardShell, type NavGroup } from './DashboardShell'
import { NotificationsMenu } from './NotificationsMenu'
import {
  GridIcon,
  StorefrontIcon,
  BoxIcon,
  LayersIcon,
  ReceiptIcon,
  UsersIcon,
  PercentIcon,
  CogIcon,
  AlertIcon,
  StarIcon,
} from './icons'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { BellIcon } from '@/shared/ui/icons'
import { useNotificationFeed } from '../lib/useNotificationFeed'

export function AdminLayout() {
  const { products, categories } = useCatalog()
  const { statusFor } = useInventory()
  const { vendors, activeVendors } = useVendors()

  const lowStock = products.filter((p) => statusFor(p) !== 'in').length
  const pendingVendors = vendors.filter((v) => v.status === 'pending').length
  const { unreadCount } = useNotificationFeed()
  const [returns] = returnsStore.useStore()
  const [payoutRequests] = payoutRequestsStore.useStore()
  const [messages] = messagesStore.useStore()
  const openReturns = returns.filter((r) => r.status === 'Requested').length
  const pendingPayouts = payoutRequests.filter((r) => r.status === 'Pending').length
  const unreadMessages = messages.filter((m) => !m.read).length

  const groups: NavGroup[] = [
    {
      items: [
        { label: 'Overview', to: '/admin', end: true, icon: GridIcon },
        { label: 'Notifications', to: '/admin/notifications', icon: BellIcon, badge: { count: unreadCount } },
      ],
    },
    {
      title: 'Catalog',
      items: [
        { label: 'Products', to: '/admin/products', icon: BoxIcon },
        { label: 'Inventory', to: '/admin/inventory', icon: AlertIcon, badge: { count: lowStock, tone: 'warning' } },
        { label: 'Categories', to: '/admin/categories', icon: LayersIcon },
      ],
    },
    {
      title: 'Sales',
      items: [
        { label: 'Orders', to: '/admin/orders', icon: ReceiptIcon },
        { label: 'Returns', to: '/admin/returns', icon: LuRotateCcw, badge: { count: openReturns, tone: 'warning' } },
        { label: 'Reviews', to: '/admin/reviews', icon: StarIcon },
        { label: 'Discounts', to: '/admin/discounts', icon: PercentIcon },
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Payouts', to: '/admin/payouts', icon: LuWallet, badge: { count: pendingPayouts } },
        { label: 'Reports', to: '/admin/reports', icon: LuChartLine },
      ],
    },
    {
      title: 'People',
      items: [
        { label: 'Vendors', to: '/admin/vendors', icon: StorefrontIcon, badge: { count: pendingVendors } },
        { label: 'Customers', to: '/admin/customers', icon: UsersIcon },
      ],
    },
    {
      title: 'Access control',
      items: [
        { label: 'Users', to: '/admin/access/users', icon: LuUsers },
        { label: 'Roles', to: '/admin/access/roles', icon: LuShieldCheck },
        { label: 'Permissions', to: '/admin/access/permissions', icon: LuKeyRound },
      ],
    },
    {
      title: 'Configure',
      items: [
        { label: 'Settings', to: '/admin/settings', icon: CogIcon },
        { label: 'Delivery zones', to: '/admin/shipping', icon: LuTruck },
        { label: 'Site content', to: '/admin/content', icon: LuLayoutTemplate, badge: { count: unreadMessages } },
      ],
    },
  ]

  return (
    <DashboardShell
      storageKey="admin"
      subtitle="Platform admin"
      groups={groups}
      user={{ name: 'Admin', role: 'Platform owner' }}
      topBarActions={<NotificationsMenu />}
      accountLinks={[
        { label: 'Your profile', to: '/admin/account', icon: LuUser },
        { label: 'Store settings', to: '/admin/settings', icon: LuSettings },
        { label: 'View storefront', to: '/', icon: LuGlobe },
        { label: 'Sign out', to: '/logout', icon: LuLogOut, tone: 'danger' },
      ]}
      accent={
        <div className="rounded-2xl bg-accent-soft/70 p-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Storefront is live
          </p>
          <p className="mt-1 text-caption text-ink-soft">
            {activeVendors.length} shops selling across {categories.length} categories.
          </p>
          <Link
            to="/"
            className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-caption font-semibold text-ink shadow-sm transition-colors hover:text-accent"
          >
            View storefront
            <LuExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      }
    />
  )
}
