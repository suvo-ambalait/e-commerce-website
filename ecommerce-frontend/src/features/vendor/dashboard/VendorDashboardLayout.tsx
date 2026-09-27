import { DashboardShell, type NavGroup } from '@/features/admin/components/DashboardShell'
import { GridIcon, BoxIcon, ReceiptIcon, WalletIcon, StorefrontIcon, StarIcon, AlertIcon } from '@/features/admin/components/icons'
import { Badge } from '@/shared/ui'
import { useCurrentVendor } from '../lib/useCurrentVendor'

const groups: NavGroup[] = [
  { items: [{ label: 'Overview', to: '/vendor/dashboard', end: true, icon: GridIcon }] },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', to: '/vendor/dashboard/products', icon: BoxIcon },
      { label: 'Inventory', to: '/vendor/dashboard/inventory', icon: AlertIcon },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', to: '/vendor/dashboard/orders', icon: ReceiptIcon },
      { label: 'Reviews', to: '/vendor/dashboard/reviews', icon: StarIcon },
      { label: 'Payouts', to: '/vendor/dashboard/payouts', icon: WalletIcon },
    ],
  },
  {
    title: 'Storefront',
    items: [{ label: 'Profile', to: '/vendor/dashboard/profile', icon: StorefrontIcon }],
  },
]

export function VendorDashboardLayout() {
  const vendor = useCurrentVendor()

  return (
    <DashboardShell
      storageKey="vendor"
      subtitle={vendor?.name ?? 'Vendor'}
      basePath="/vendor/dashboard"
      groups={groups}
      user={{ name: vendor?.name ?? 'Vendor', role: 'Studio owner' }}
      accent={
        vendor && vendor.status !== 'active' ? (
          <div className="rounded-2xl bg-warning-soft px-3.5 py-3 text-caption text-warning">
            <Badge tone="warning">{vendor.status}</Badge>
            <p className="mt-1 leading-snug">Storefront hidden until a curator approves it.</p>
          </div>
        ) : null
      }
    />
  )
}
