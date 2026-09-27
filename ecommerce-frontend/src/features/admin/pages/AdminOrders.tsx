import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuBan, LuCircleCheck, LuEye, LuMail, LuTruck } from 'react-icons/lu'
import { PageHeader, DataTable, BulkButton, type Column } from '../components/primitives'
import {
  ColumnsMenu,
  DensityToggle,
  ExportButton,
  FilterField,
  FilterMenu,
  Pill,
  TableSearch,
  TableTabs,
  TableToolbar,
  downloadCsv,
  useTablePrefs,
} from '../components/TableKit'
import { Avatar, Select } from '@/shared/ui'
import { formatDate, formatPrice, formatPriceWhole } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useUpdateShipmentStatus } from '@/features/inventory/lib/useUpdateShipmentStatus'
import { useVendors } from '@/features/vendor/context/VendorContext'
import type { Order, ShipmentStatus } from '@/shared/types'
import { overallStatus, shipmentTone } from '@/features/orders/lib/status'

type Tab = 'all' | ShipmentStatus

export function AdminOrders() {
  const navigate = useNavigate()
  const { orders } = useOrders()
  const updateShipmentStatus = useUpdateShipmentStatus()
  const { vendors, getVendor } = useVendors()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [vendorId, setVendorId] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [prefs, setPrefs] = useTablePrefs('admin-orders')

  const count = (st: ShipmentStatus) => orders.filter((o) => overallStatus(o) === st).length
  const toFulfil = count('Processing')
  const revenue = orders.reduce((n, o) => n + o.grandTotal, 0)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (tab !== 'all' && overallStatus(o) !== tab) return false
      if (vendorId && !o.shipments.some((s) => s.vendorId === vendorId)) return false
      if (q && !`${o.orderNumber} ${o.email} ${o.shippingInfo.fullName}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [orders, search, tab, vendorId])

  const setAll = (numbers: string[], status: ShipmentStatus) => {
    for (const num of numbers) {
      const order = orders.find((o) => o.orderNumber === num)
      order?.shipments.forEach((s) => s.status !== 'Cancelled' && updateShipmentStatus(num, s.vendorId, status))
    }
    notify(`${numbers.length} order${numbers.length > 1 ? 's' : ''} marked ${status.toLowerCase()}`, 'success')
  }

  const columns: Column<Order>[] = [
    {
      header: 'Order',
      id: 'order',
      sortValue: (o) => o.orderNumber,
      cell: (o) => (
        <Link to={`/admin/orders/${o.orderNumber}`} className="group block">
          <span className="block font-display font-bold text-ink group-hover:text-accent">{o.orderNumber}</span>
          <span className="block text-[11px] text-ink-mute">
            {o.shipments.reduce((n, s) => n + s.items.reduce((m, i) => m + i.quantity, 0), 0)} items
          </span>
        </Link>
      ),
    },
    {
      header: 'Customer',
      id: 'customer',
      hideBelow: 'lg',
      sortValue: (o) => o.shippingInfo.fullName || o.email,
      cell: (o) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={o.shippingInfo.fullName || o.email} size={28} />
          <span className="min-w-0">
            <span className="block max-w-40 truncate font-semibold text-ink">{o.shippingInfo.fullName || '—'}</span>
            <span className="block max-w-40 truncate text-[11px] text-ink-mute">{o.email}</span>
          </span>
        </span>
      ),
    },
    {
      header: 'Date',
      id: 'date',
      hideBelow: 'md',
      sortValue: (o) => o.date,
      cell: (o) => <span className="whitespace-nowrap text-ink-mute">{formatDate(o.date)}</span>,
    },
    {
      header: 'Shipments',
      id: 'shipments',
      cell: (o) => (
        <div className="space-y-1">
          {o.shipments.map((s) => {
            const v = getVendor(s.vendorId)
            return (
              <div key={s.vendorId} className="flex items-center gap-2">
                <Avatar src={v?.logo} name={v?.name ?? '?'} size={18} />
                <span className="max-w-24 truncate text-caption text-ink-soft">{v?.name}</span>
                <Pill tone={shipmentTone[s.status]} dot>
                  {s.status}
                </Pill>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      header: 'Total',
      id: 'total',
      align: 'right',
      sortValue: (o) => o.grandTotal,
      cell: (o) => <span className="font-bold text-ink tabular-nums">{formatPrice(o.grandTotal)}</span>,
    },
    {
      header: 'Status',
      id: 'status',
      hideBelow: 'sm',
      sortValue: (o) => overallStatus(o),
      cell: (o) => (
        <Pill tone={shipmentTone[overallStatus(o)]} dot>
          {overallStatus(o)}
        </Pill>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        description={`${orders.length} orders · ${toFulfil} to fulfil · ${formatPriceWhole(revenue)} total`}
        action={
          <ExportButton
            onClick={() =>
              downloadCsv(
                'orders.csv',
                ['order', 'date', 'customer', 'email', 'total', 'status'],
                rows.map((o) => [o.orderNumber, o.date.slice(0, 10), o.shippingInfo.fullName, o.email, o.grandTotal, overallStatus(o)]),
              )
            }
          />
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(o) => o.orderNumber}
        empty="No orders match."
        toolbar={
          <TableToolbar
            end={
              <>
                <DensityToggle value={prefs.density} onChange={(density) => setPrefs((p) => ({ ...p, density }))} />
                <ColumnsMenu
                  options={[
                    { id: 'customer', label: 'Customer' },
                    { id: 'date', label: 'Date' },
                    { id: 'shipments', label: 'Shipments' },
                    { id: 'status', label: 'Status' },
                  ]}
                  hidden={prefs.hidden}
                  onChange={(hidden) => setPrefs((p) => ({ ...p, hidden }))}
                />
                <FilterMenu count={vendorId ? 1 : 0} onClear={() => setVendorId('')}>
                  <FilterField label="Maker">
                    <Select
                      size="sm"
                      value={vendorId}
                      onChange={setVendorId}
                      options={[{ value: '', label: 'All makers' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
                    />
                  </FilterField>
                </FilterMenu>
              </>
            }
          >
            <TableSearch value={search} onChange={setSearch} placeholder="Order #, name or email" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: orders.length },
                { value: 'Processing', label: 'Processing', count: count('Processing') },
                { value: 'Shipped', label: 'Shipped', count: count('Shipped') },
                { value: 'Delivered', label: 'Delivered', count: count('Delivered') },
                { value: 'Cancelled', label: 'Cancelled', count: count('Cancelled') },
              ]}
            />
          </TableToolbar>
        }
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        density={prefs.density}
        hiddenColumns={prefs.hidden}
        defaultSort={{ id: 'date', dir: 'desc' }}
        rowActions={[
          { label: 'View order', icon: LuEye, onClick: (o) => navigate(`/admin/orders/${o.orderNumber}`) },
          { label: 'Email customer', icon: LuMail, onClick: (o) => window.open(`mailto:${o.email}?subject=Order ${o.orderNumber}`) },
          {
            label: 'Mark shipped',
            icon: LuTruck,
            onClick: (o) => setAll([o.orderNumber], 'Shipped'),
            hidden: (o) => overallStatus(o) !== 'Processing',
          },
          {
            label: 'Mark delivered',
            icon: LuCircleCheck,
            onClick: (o) => setAll([o.orderNumber], 'Delivered'),
            hidden: (o) => ['Delivered', 'Cancelled'].includes(overallStatus(o)),
          },
          {
            label: 'Cancel order',
            icon: LuBan,
            danger: true,
            onClick: (o) => {
              if (confirm(`Cancel ${o.orderNumber}? Units go back into stock.`)) setAll([o.orderNumber], 'Cancelled')
            },
            hidden: (o) => overallStatus(o) === 'Cancelled',
          },
        ]}
        bulkBar={(keys, clear) => (
          <>
            <BulkButton
              icon={LuTruck}
              onClick={() => {
                setAll(keys, 'Shipped')
                clear()
              }}
            >
              Mark shipped
            </BulkButton>
            <BulkButton
              icon={LuCircleCheck}
              onClick={() => {
                setAll(keys, 'Delivered')
                clear()
              }}
            >
              Mark delivered
            </BulkButton>
          </>
        )}
      />
    </div>
  )
}
