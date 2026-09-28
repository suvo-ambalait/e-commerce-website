import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LuBan, LuCheck, LuClock, LuCoins, LuWallet } from 'react-icons/lu'
import { PageHeader, Panel, StatCard, StatGrid, FadeItem, DataTable, type Column } from '../components/primitives'
import { ExportButton, Pill, TableSearch, TableTabs, TableToolbar, downloadCsv } from '../components/TableKit'
import { Avatar, Button, Field, Input, Modal, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { formatDate, formatPrice, formatPriceWhole } from '@/shared/lib/format'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useSettings } from '../context/SettingsContext'
import { payoutMethodLabel, payoutMethodsStore, payoutRequestsStore, type PayoutRequest, type PayoutStatus } from '@/features/marketplace/stores'
import { maskAccount, vendorBalance } from '@/features/marketplace/payouts'
import { payoutTone } from '@/features/marketplace/labels'

type Tab = 'all' | PayoutStatus

export function AdminPayouts() {
  const [requests, setRequests] = payoutRequestsStore.useStore()
  const [methods] = payoutMethodsStore.useStore()
  const { orders } = useOrders()
  const { vendors, getVendor } = useVendors()
  const { settings } = useSettings()
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('Pending')
  const [search, setSearch] = useState('')
  const [acting, setActing] = useState<{ request: PayoutRequest; to: 'Paid' | 'Rejected' } | null>(null)

  const rows = requests.filter((r) => {
    if (tab !== 'all' && r.status !== tab) return false
    const q = search.trim().toLowerCase()
    return !q || (getVendor(r.vendorId)?.name ?? '').toLowerCase().includes(q)
  })

  const pending = requests.filter((r) => r.status === 'Pending')
  const paidTotal = requests.filter((r) => r.status === 'Paid').reduce((n, r) => n + r.amount, 0)

  // what every shop has earned but not yet withdrawn
  const balances = useMemo(
    () =>
      vendors
        .map((v) => ({ vendor: v, ...vendorBalance(orders, v.id, settings.commissionRate, requests) }))
        .filter((b) => b.released > 0)
        .sort((a, b) => b.available - a.available),
    [vendors, orders, settings.commissionRate, requests],
  )
  const owed = balances.reduce((n, b) => n + b.available, 0)

  const decide = (r: PayoutRequest, to: 'Paid' | 'Rejected', reference: string, note: string) => {
    setRequests((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, status: to, processedAt: new Date().toISOString(), reference: reference.trim() || undefined, note: note.trim() || undefined } : x,
      ),
    )
    notify(to === 'Paid' ? `Marked ${formatPrice(r.amount)} as paid` : 'Withdrawal declined', 'success')
  }

  const columns: Column<PayoutRequest>[] = [
    {
      header: 'Shop',
      id: 'shop',
      sortValue: (r) => getVendor(r.vendorId)?.name ?? '',
      cell: (r) => {
        const v = getVendor(r.vendorId)
        return (
          <Link to={`/admin/vendors/${r.vendorId}`} className="group flex items-center gap-3">
            <Avatar src={v?.logo} name={v?.name ?? '?'} size={34} />
            <span className="min-w-0">
              <span className="block max-w-44 truncate font-display font-bold text-ink group-hover:text-accent">{v?.name ?? 'Unknown shop'}</span>
              <span className="block text-[11px] text-ink-mute">Requested {formatDate(r.requestedAt)}</span>
            </span>
          </Link>
        )
      },
    },
    {
      header: 'Send to',
      id: 'method',
      hideBelow: 'md',
      cell: (r) => (
        <span className="block">
          <span className="block font-semibold text-ink">
            {r.method.type === 'bank' ? r.method.bankName : payoutMethodLabel[r.method.type]} · {r.method.accountNumber}
          </span>
          <span className="block text-[11px] text-ink-mute">
            {r.method.accountName}
            {r.method.branch && ` · ${r.method.branch}`}
            {r.method.routingNumber && ` · routing ${r.method.routingNumber}`}
          </span>
        </span>
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
        <span className="block">
          <Pill tone={payoutTone[r.status]} dot>
            {r.status}
          </Pill>
          {r.reference && <span className="mt-0.5 block text-[11px] text-ink-mute">Ref. {r.reference}</span>}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payouts"
        description="Pay shops what they’ve earned from delivered orders."
        action={
          <ExportButton
            onClick={() =>
              downloadCsv(
                'payouts.csv',
                ['shop', 'amount', 'method', 'account_name', 'account_number', 'bank', 'branch', 'status', 'requested', 'processed', 'reference'],
                rows.map((r) => [
                  getVendor(r.vendorId)?.name ?? '',
                  r.amount.toFixed(2),
                  payoutMethodLabel[r.method.type],
                  r.method.accountName,
                  r.method.accountNumber,
                  r.method.bankName ?? '',
                  r.method.branch ?? '',
                  r.status,
                  r.requestedAt.slice(0, 10),
                  r.processedAt?.slice(0, 10) ?? '',
                  r.reference ?? '',
                ]),
              )
            }
          />
        }
      />

      <StatGrid>
        <FadeItem>
          <StatCard label="Waiting to be paid" value={formatPriceWhole(pending.reduce((n, r) => n + r.amount, 0))} icon={LuClock} hint={`${pending.length} requests`} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Paid out" value={formatPriceWhole(paidTotal)} icon={LuCheck} hint="all time" />
        </FadeItem>
        <FadeItem>
          <StatCard label="Owed to shops" value={formatPriceWhole(owed)} icon={LuWallet} hint="released, not yet requested" />
        </FadeItem>
        <FadeItem>
          <StatCard label="Commission rate" value={`${Math.round(settings.commissionRate * 100)}%`} icon={LuCoins} hint="set in Settings" />
        </FadeItem>
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        <DataTable
          rows={rows}
          columns={columns}
          keyOf={(r) => r.id}
          empty={requests.length === 0 ? 'No withdrawal requests yet. Shops request them from their Payouts page.' : 'No requests match.'}
          toolbar={
            <TableToolbar>
              <TableSearch value={search} onChange={setSearch} placeholder="Shop name" />
              <TableTabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: 'Pending', label: 'To pay', count: pending.length },
                  { value: 'Paid', label: 'Paid', count: requests.filter((r) => r.status === 'Paid').length },
                  { value: 'Rejected', label: 'Declined', count: requests.filter((r) => r.status === 'Rejected').length },
                  { value: 'all', label: 'All', count: requests.length },
                ]}
              />
            </TableToolbar>
          }
          defaultSort={{ id: 'shop', dir: 'asc' }}
          rowActions={[
            { label: 'Mark as paid', icon: LuCheck, onClick: (r) => setActing({ request: r, to: 'Paid' }), hidden: (r) => r.status !== 'Pending' },
            { label: 'Decline', icon: LuBan, danger: true, onClick: (r) => setActing({ request: r, to: 'Rejected' }), hidden: (r) => r.status !== 'Pending' },
          ]}
        />

        <Panel title="Shop balances" subtitle="Released earnings not yet withdrawn">
          {balances.length === 0 ? (
            <p className="text-sm text-ink-mute">No shop has released earnings yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {balances.slice(0, 8).map((b) => (
                <li key={b.vendor.id} className="flex items-center gap-3 py-2.5">
                  <Avatar src={b.vendor.logo} name={b.vendor.name} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{b.vendor.name}</span>
                    <span className="block text-[11px] text-ink-mute">
                      {methods[b.vendor.id] ? payoutMethodLabel[methods[b.vendor.id].type] + ' ' + maskAccount(methods[b.vendor.id].accountNumber) : 'No payout method yet'}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-ink tabular-nums">{formatPrice(b.available)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {acting && (
        <PayoutDecision
          request={acting.request}
          to={acting.to}
          shopName={getVendor(acting.request.vendorId)?.name ?? 'Shop'}
          onClose={() => setActing(null)}
          onConfirm={(ref, note) => {
            decide(acting.request, acting.to, ref, note)
            setActing(null)
          }}
        />
      )}
    </div>
  )
}

function PayoutDecision({
  request,
  to,
  shopName,
  onClose,
  onConfirm,
}: {
  request: PayoutRequest
  to: 'Paid' | 'Rejected'
  shopName: string
  onClose: () => void
  onConfirm: (reference: string, note: string) => void
}) {
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const paying = to === 'Paid'
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onConfirm(reference, note)
  }
  return (
    <Modal open onClose={onClose} title={paying ? 'Mark as paid' : 'Decline withdrawal'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-surface-sunken/70 px-4 py-3 text-sm">
          <p className="flex justify-between gap-3">
            <span className="text-ink-soft">{shopName}</span>
            <span className="font-bold text-ink tabular-nums">{formatPrice(request.amount)}</span>
          </p>
          <p className="mt-1 text-caption text-ink-mute">
            {payoutMethodLabel[request.method.type]} · {request.method.accountName} · {request.method.accountNumber}
          </p>
        </div>
        {paying ? (
          <Field label="Transaction reference" required hint="Bank or wallet transaction ID — the shop sees this">
            {(id) => <Input id={id} required value={reference} onChange={(e) => setReference(e.target.value)} />}
          </Field>
        ) : (
          <Field label="Reason" required hint="The shop sees this message">
            {(id) => <Textarea id={id} required rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={paying ? 'primary' : 'danger'}>
            {paying ? 'Mark as paid' : 'Decline'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
