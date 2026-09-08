import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, DataTable, type Column } from '../components/primitives'
import { Avatar, Badge } from '@/shared/ui'
import { formatPrice } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useAuth } from '@/features/auth/context/AuthContext'

interface Row {
  email: string
  name: string
  role: string
  orders: number
  spent: number
}

export function AdminCustomers() {
  const { orders } = useOrders()
  const { users } = useAuth()

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>()
    for (const user of users) {
      map.set(user.email, { email: user.email, name: user.name, role: user.role, orders: 0, spent: 0 })
    }
    for (const order of orders) {
      const existing = map.get(order.email) ?? {
        email: order.email,
        name: order.shippingInfo.fullName || order.email.split('@')[0],
        role: 'customer',
        orders: 0,
        spent: 0,
      }
      existing.orders += 1
      existing.spent += order.grandTotal
      map.set(order.email, existing)
    }
    return [...map.values()].sort((a, b) => b.spent - a.spent)
  }, [orders, users])

  const columns: Column<Row>[] = [
    {
      header: 'Customer',
      cell: (r) => (
        <Link to={`/admin/customers/${encodeURIComponent(r.email)}`} className="flex items-center gap-3">
          <Avatar name={r.name} size={30} />
          <div>
            <p className="font-medium text-ink hover:text-accent">{r.name}</p>
            <p className="text-caption text-ink-mute">{r.email}</p>
          </div>
        </Link>
      ),
    },
    { header: 'Role', cell: (r) => <Badge tone={r.role === 'admin' ? 'inverse' : r.role === 'vendor' ? 'accent' : 'neutral'}>{r.role}</Badge>, hideBelow: 'sm' },
    { header: 'Orders', cell: (r) => r.orders, hideBelow: 'sm' },
    { header: 'Lifetime spend', cell: (r) => formatPrice(r.spent) },
    {
      header: '',
      className: 'text-right',
      cell: (r) => (
        <Link to={`/admin/customers/${encodeURIComponent(r.email)}`} className="text-caption text-accent hover:underline">
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Customers" description={`${rows.length} accounts`} />
      <DataTable rows={rows} columns={columns} keyOf={(r) => r.email} empty="No customers yet." />
    </div>
  )
}
