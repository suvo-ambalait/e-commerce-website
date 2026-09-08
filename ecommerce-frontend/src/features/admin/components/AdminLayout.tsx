import { DashboardShell, type NavGroup } from './DashboardShell'
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

const groups: NavGroup[] = [
  { items: [{ label: 'Overview', to: '/admin', end: true, icon: GridIcon }] },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', to: '/admin/products', icon: BoxIcon },
      { label: 'Inventory', to: '/admin/inventory', icon: AlertIcon },
      { label: 'Categories', to: '/admin/categories', icon: LayersIcon },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: ReceiptIcon },
      { label: 'Reviews', to: '/admin/reviews', icon: StarIcon },
      { label: 'Discounts', to: '/admin/discounts', icon: PercentIcon },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Vendors', to: '/admin/vendors', icon: StorefrontIcon },
      { label: 'Customers', to: '/admin/customers', icon: UsersIcon },
    ],
  },
  { title: 'Configure', items: [{ label: 'Settings', to: '/admin/settings', icon: CogIcon }] },
]

export function AdminLayout() {
  return <DashboardShell storageKey="admin" subtitle="Platform admin" basePath="/admin" groups={groups} />
}
