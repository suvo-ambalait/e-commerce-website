import { Link } from 'react-router-dom'
import { LuRotateCcw } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Badge, ButtonLink, EmptyState } from '@/shared/ui'
import { formatDateLong, formatPrice } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { returnsStore } from '@/features/marketplace/stores'
import { returnTone } from '@/features/marketplace/labels'
import { AccountCard } from '../components/AccountLayout'
import { useCustomer } from '../lib/useCustomer'

const nextStep: Record<string, string> = {
  Requested: 'We sent your request to the shop. You will get a reply within 2 working days.',
  Approved: 'Approved. The courier will call you to collect the parcel. Please keep it ready.',
  Rejected: 'Sorry, this request was not accepted. Please read the note from the shop.',
  Refunded: 'Your money has been sent back the same way you paid. It can take 5–7 working days to arrive.',
}

export function AccountReturnsPage() {
  useDocumentTitle('Returns · AmbalaEshop')
  const { profile } = useCustomer()
  const [all] = returnsStore.useStore()
  const { getVendor } = useVendors()
  const mine = all.filter((r) => r.email.toLowerCase() === profile.email.toLowerCase())

  return (
    <AccountCard title="Returns & cancellations" subtitle="Start a return or cancellation from the order it belongs to.">
      {mine.length === 0 ? (
        <EmptyState
          icon={<LuRotateCcw />}
          title="No returns"
          description="If something isn’t right, open the order and choose “Request a return” on that parcel."
          action={<ButtonLink to="/account/orders" variant="secondary">Go to your orders</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {mine.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    {r.kind === 'cancel' ? 'Cancellation' : 'Return'} ·{' '}
                    <Link to={`/account/orders/${r.orderNumber}`} className="text-accent hover:underline">
                      {r.orderNumber}
                    </Link>
                    <Badge tone={returnTone[r.status]}>{r.status}</Badge>
                  </p>
                  <p className="mt-0.5 text-caption text-ink-mute">
                    {getVendor(r.vendorId)?.name ?? 'Shop'} · {formatDateLong(r.createdAt)} · {r.reason}
                  </p>
                </div>
                <p className="text-right">
                  <span className="block text-caption text-ink-mute">{r.resolution}</span>
                  <span className="font-display font-bold text-ink tabular-nums">{formatPrice(r.amount)}</span>
                </p>
              </div>
              <div className="mt-3 flex -space-x-2">
                {r.items.map((i) => (
                  <img key={i.key} src={i.image} alt={i.name} title={i.name} className="h-10 w-10 rounded-lg object-cover ring-2 ring-surface" />
                ))}
              </div>
              <p className="mt-3 rounded-xl bg-surface-sunken/70 px-3.5 py-2.5 text-caption text-ink-soft">
                {nextStep[r.status]}
                {r.note && <span className="mt-1 block text-ink">Note from the shop: “{r.note}”</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AccountCard>
  )
}
