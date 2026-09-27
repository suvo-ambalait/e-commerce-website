import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuEye, LuMail } from 'react-icons/lu'
import { PageHeader, DataTable, type Column } from '../components/primitives'
import {
  ColumnsMenu,
  DensityToggle,
  ExportButton,
  Pill,
  TableSearch,
  TableTabs,
  TableToolbar,
  downloadCsv,
  useTablePrefs,
} from '../components/TableKit'
import { Avatar } from '@/shared/ui'
import { formatDate, formatPrice, formatPriceWhole } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'

interface Row {
  email: string
  name: string
  orders: number
  spent: number
  lastOrder: string
  city: string
}

type Tab = 'all' | 'repeat' | 'new'

export function AdminCustomers() {
  const navigate = useNavigate()
  const { orders } = useOrders()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [prefs, setPrefs] = useTablePrefs('admin-customers')

  const all = useMemo<Row[]>(() => {
    const map = new Map<string, Row>()
    for (const order of orders) {
      const row = map.get(order.email) ?? {
        email: order.email,
        name: order.shippingInfo.fullName || order.email.split('@')[0],
        orders: 0,
        spent: 0,
        lastOrder: order.date,
        city: [order.shippingInfo.city, order.shippingInfo.country].filter(Boolean).join(', '),
      }
      row.orders += 1
      row.spent += order.grandTotal
      if (order.date > row.lastOrder) row.lastOrder = order.date
      map.set(order.email, row)
    }
    return [...map.values()]
  }, [orders])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter((r) => {
      if (tab === 'repeat' && r.orders < 2) return false
      if (tab === 'new' && r.orders !== 1) return false
      if (q && !`${r.name} ${r.email} ${r.city}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [all, search, tab])

  const repeat = all.filter((r) => r.orders > 1).length
  const lifetime = all.reduce((n, r) => n + r.spent, 0)

  const columns: Column<Row>[] = [
    {
      header: 'Customer',
      id: 'customer',
      sortValue: (r) => r.name,
      cell: (r) => (
        <Link to={`/admin/customers/${encodeURIComponent(r.email)}`} className="group flex items-center gap-3">
          <Avatar name={r.name} size={36} />
          <span className="min-w-0">
            <span className="block max-w-48 truncate font-display font-bold text-ink group-hover:text-accent">{r.name}</span>
            <span className="block max-w-48 truncate text-[11px] text-ink-mute">{r.email}</span>
          </span>
        </Link>
      ),
    },
    {
      header: 'Location',
      id: 'location',
      hideBelow: 'lg',
      sortValue: (r) => r.city,
      cell: (r) => <span className="whitespace-nowrap text-ink-soft">{r.city || '—'}</span>,
    },
    {
      header: 'Orders',
      id: 'orders',
      align: 'right',
      sortValue: (r) => r.orders,
      cell: (r) => <span className="font-semibold text-ink tabular-nums">{r.orders}</span>,
    },
    {
      header: 'Avg order',
      id: 'avg',
      align: 'right',
      hideBelow: 'md',
      sortValue: (r) => r.spent / r.orders,
      cell: (r) => <span className="text-ink-soft tabular-nums">{formatPrice(r.spent / r.orders)}</span>,
    },
    {
      header: 'Lifetime spend',
      id: 'spent',
      align: 'right',
      sortValue: (r) => r.spent,
      cell: (r) => <span className="font-bold text-ink tabular-nums">{formatPrice(r.spent)}</span>,
    },
    {
      header: 'Last order',
      id: 'last',
      hideBelow: 'md',
      sortValue: (r) => r.lastOrder,
      cell: (r) => <span className="whitespace-nowrap text-ink-mute">{formatDate(r.lastOrder)}</span>,
    },
    {
      header: 'Type',
      id: 'type',
      hideBelow: 'sm',
      sortValue: (r) => r.orders,
      cell: (r) =>
        r.orders > 1 ? (
          <Pill tone="accent" dot>
            Repeat
          </Pill>
        ) : (
          <Pill tone="neutral" dot>
            New
          </Pill>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description={`${all.length} customers · ${repeat} repeat · ${formatPriceWhole(lifetime)} lifetime spend`}
        action={
          <ExportButton
            onClick={() =>
              downloadCsv(
                'customers.csv',
                ['name', 'email', 'location', 'orders', 'lifetime_spend', 'last_order'],
                rows.map((r) => [r.name, r.email, r.city, r.orders, r.spent.toFixed(2), r.lastOrder.slice(0, 10)]),
              )
            }
          />
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(r) => r.email}
        empty="No customers match."
        toolbar={
          <TableToolbar
            end={
              <>
                <DensityToggle value={prefs.density} onChange={(density) => setPrefs((p) => ({ ...p, density }))} />
                <ColumnsMenu
                  options={[
                    { id: 'location', label: 'Location' },
                    { id: 'avg', label: 'Avg order' },
                    { id: 'last', label: 'Last order' },
                    { id: 'type', label: 'Type' },
                  ]}
                  hidden={prefs.hidden}
                  onChange={(hidden) => setPrefs((p) => ({ ...p, hidden }))}
                />
              </>
            }
          >
            <TableSearch value={search} onChange={setSearch} placeholder="Name, email or city" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: all.length },
                { value: 'repeat', label: 'Repeat', count: repeat },
                { value: 'new', label: 'New', count: all.length - repeat },
              ]}
            />
          </TableToolbar>
        }
        density={prefs.density}
        hiddenColumns={prefs.hidden}
        defaultSort={{ id: 'spent', dir: 'desc' }}
        rowActions={[
          { label: 'View customer', icon: LuEye, onClick: (r) => navigate(`/admin/customers/${encodeURIComponent(r.email)}`) },
          { label: 'Email customer', icon: LuMail, onClick: (r) => window.open(`mailto:${r.email}`) },
        ]}
      />
    </div>
  )
}
