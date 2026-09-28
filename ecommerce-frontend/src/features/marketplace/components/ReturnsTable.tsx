import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LuBan, LuCheck, LuMail, LuWallet } from 'react-icons/lu'
import { DataTable, type Column } from '@/features/admin/components/primitives'
import { ExportButton, Pill, TableSearch, TableTabs, TableToolbar, downloadCsv } from '@/features/admin/components/TableKit'
import { Button, Field, Modal, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useUpdateShipmentStatus } from '@/features/inventory/lib/useUpdateShipmentStatus'
import { returnsStore, type ReturnRequest, type ReturnStatus } from '../stores'
import { returnTone } from '../labels'

type Tab = 'all' | ReturnStatus

/**
 * Return and cancellation requests with actions. Admins see every shop;
 * vendors pass `vendorId` to see only their own parcels.
 */
export function ReturnsTable({ vendorId, orderPath }: { vendorId?: string; orderPath: (orderNumber: string) => string }) {
  const [all, setAll] = returnsStore.useStore()
  const { getVendor } = useVendors()
  const updateShipmentStatus = useUpdateShipmentStatus()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('Requested')
  const [acting, setActing] = useState<{ request: ReturnRequest; to: ReturnStatus } | null>(null)

  const scoped = useMemo(() => (vendorId ? all.filter((r) => r.vendorId === vendorId) : all), [all, vendorId])
  const rows = scoped.filter((r) => {
    if (tab !== 'all' && r.status !== tab) return false
    const q = search.trim().toLowerCase()
    return !q || `${r.orderNumber} ${r.customerName} ${r.email}`.toLowerCase().includes(q)
  })
  const count = (s: ReturnStatus) => scoped.filter((r) => r.status === s).length

  const apply = (request: ReturnRequest, to: ReturnStatus, note: string) => {
    setAll((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: to, note: note.trim() || r.note, updatedAt: new Date().toISOString() } : r)),
    )
    // an approved cancellation cancels the parcel, which also puts stock back
    if (to === 'Approved' && request.kind === 'cancel') updateShipmentStatus(request.orderNumber, request.vendorId, 'Cancelled')
    notify(`Request ${to.toLowerCase()}`, 'success')
  }

  const columns: Column<ReturnRequest>[] = [
    {
      header: 'Request',
      id: 'request',
      sortValue: (r) => r.createdAt,
      cell: (r) => (
        <div className="min-w-0">
          <Link to={orderPath(r.orderNumber)} className="font-display font-bold text-ink hover:text-accent">
            {r.orderNumber}
          </Link>
          <span className="block text-[11px] text-ink-mute">
            {r.kind === 'cancel' ? 'Cancellation' : `Return · ${r.resolution.toLowerCase()}`} · {formatDate(r.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      id: 'customer',
      hideBelow: 'md',
      sortValue: (r) => r.customerName,
      cell: (r) => (
        <span className="block max-w-44">
          <span className="block truncate font-semibold text-ink">{r.customerName}</span>
          <span className="block truncate text-[11px] text-ink-mute">{r.email}</span>
        </span>
      ),
    },
    ...(vendorId
      ? []
      : [
          {
            header: 'Shop',
            id: 'shop',
            hideBelow: 'lg',
            sortValue: (r: ReturnRequest) => getVendor(r.vendorId)?.name ?? '',
            cell: (r: ReturnRequest) => <span className="text-ink-soft">{getVendor(r.vendorId)?.name ?? '—'}</span>,
          } satisfies Column<ReturnRequest>,
        ]),
    {
      header: 'Reason',
      id: 'reason',
      hideBelow: 'lg',
      cell: (r) => (
        <span className="block max-w-56">
          <span className="block text-ink-soft">{r.reason}</span>
          {r.details && <span className="block truncate text-[11px] text-ink-mute" title={r.details}>“{r.details}”</span>}
        </span>
      ),
    },
    {
      header: 'Items',
      id: 'items',
      hideBelow: 'sm',
      cell: (r) => (
        <div className="flex -space-x-2">
          {r.items.slice(0, 3).map((i) => (
            <img key={i.key} src={i.image} alt="" title={i.name} className="h-8 w-8 rounded-lg object-cover ring-2 ring-surface" />
          ))}
        </div>
      ),
    },
    {
      header: 'Amount',
      id: 'amount',
      align: 'right',
      sortValue: (r) => r.amount,
      cell: (r) => <span className="font-bold text-ink tabular-nums">{formatPrice(r.amount)}</span>,
    },
    {
      header: 'Status',
      id: 'status',
      sortValue: (r) => r.status,
      cell: (r) => (
        <Pill tone={returnTone[r.status]} dot>
          {r.status}
        </Pill>
      ),
    },
  ]

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(r) => r.id}
        empty={scoped.length === 0 ? 'No return or cancellation requests yet.' : 'No requests match.'}
        toolbar={
          <TableToolbar
            end={
              <ExportButton
                onClick={() =>
                  downloadCsv(
                    'returns.csv',
                    ['order', 'type', 'customer', 'email', 'shop', 'reason', 'amount', 'status', 'requested'],
                    rows.map((r) => [
                      r.orderNumber,
                      r.kind,
                      r.customerName,
                      r.email,
                      getVendor(r.vendorId)?.name ?? '',
                      r.reason,
                      r.amount.toFixed(2),
                      r.status,
                      r.createdAt.slice(0, 10),
                    ]),
                  )
                }
              />
            }
          >
            <TableSearch value={search} onChange={setSearch} placeholder="Order # or customer" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'Requested', label: 'To review', count: count('Requested') },
                { value: 'Approved', label: 'Approved', count: count('Approved') },
                { value: 'Refunded', label: 'Refunded', count: count('Refunded') },
                { value: 'Rejected', label: 'Declined', count: count('Rejected') },
                { value: 'all', label: 'All', count: scoped.length },
              ]}
            />
          </TableToolbar>
        }
        defaultSort={{ id: 'request', dir: 'desc' }}
        rowActions={[
          { label: 'Approve', icon: LuCheck, onClick: (r) => setActing({ request: r, to: 'Approved' }), hidden: (r) => r.status !== 'Requested' },
          { label: 'Mark refunded', icon: LuWallet, onClick: (r) => setActing({ request: r, to: 'Refunded' }), hidden: (r) => r.status !== 'Approved' },
          { label: 'Email customer', icon: LuMail, onClick: (r) => window.open(`mailto:${r.email}?subject=Your request for ${r.orderNumber}`) },
          {
            label: 'Decline',
            icon: LuBan,
            danger: true,
            onClick: (r) => setActing({ request: r, to: 'Rejected' }),
            hidden: (r) => r.status !== 'Requested',
          },
        ]}
      />

      {acting && (
        <DecisionModal
          request={acting.request}
          to={acting.to}
          onClose={() => setActing(null)}
          onConfirm={(note) => {
            apply(acting.request, acting.to, note)
            setActing(null)
          }}
        />
      )}
    </>
  )
}

const copy: Record<ReturnStatus, { title: string; button: string; hint: string }> = {
  Approved: { title: 'Approve request', button: 'Approve', hint: 'Tell the customer how to send the item back, or confirm the cancellation.' },
  Refunded: { title: 'Mark as refunded', button: 'Mark refunded', hint: 'Add the refund reference so the customer can check it.' },
  Rejected: { title: 'Decline request', button: 'Decline', hint: 'Explain why, so the customer knows what to do next.' },
  Requested: { title: '', button: '', hint: '' },
}

function DecisionModal({
  request,
  to,
  onClose,
  onConfirm,
}: {
  request: ReturnRequest
  to: ReturnStatus
  onClose: () => void
  onConfirm: (note: string) => void
}) {
  const [note, setNote] = useState('')
  const c = copy[to]
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onConfirm(note)
  }
  return (
    <Modal open onClose={onClose} title={c.title}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-surface-sunken/70 px-4 py-3 text-sm">
          <span className="text-ink-soft">
            {request.orderNumber} · {request.customerName}
          </span>
          <span className="font-bold text-ink tabular-nums">{formatPrice(request.amount)}</span>
        </div>
        <Field label="Note to the customer" required={to === 'Rejected'} hint={c.hint}>
          {(id) => <Textarea id={id} rows={3} required={to === 'Rejected'} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={to === 'Rejected' ? 'danger' : 'primary'}>
            {c.button}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
