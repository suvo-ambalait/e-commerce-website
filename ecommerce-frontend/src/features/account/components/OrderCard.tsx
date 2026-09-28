import { Link } from 'react-router-dom'
import { LuChevronRight } from 'react-icons/lu'
import { Badge } from '@/shared/ui'
import { formatDateLong, formatPrice } from '@/shared/lib/format'
import type { Order } from '@/shared/types'
import { itemCount, orderProgress, progressTone } from '../lib/useCustomer'

/** One order in the customer's list: thumbnails, number, date, status and total. */
export function OrderCard({ order }: { order: Order }) {
  const items = order.shipments.flatMap((s) => s.items)
  const progress = orderProgress(order)
  const shops = order.shipments.length

  return (
    <Link
      to={`/account/orders/${order.orderNumber}`}
      className="group flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-accent/40! hover:shadow-md sm:flex-nowrap"
    >
      <div className="flex shrink-0 -space-x-3">
        {items.slice(0, 3).map((i) => (
          <img key={i.key} src={i.image} alt="" className="h-14 w-14 rounded-xl object-cover ring-2 ring-surface" />
        ))}
        {items.length > 3 && (
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-soft text-caption font-semibold text-accent ring-2 ring-surface">
            +{items.length - 3}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display font-bold text-ink group-hover:text-accent">{order.orderNumber}</p>
          <Badge tone={progressTone[progress]}>{progress}</Badge>
        </div>
        <p className="mt-0.5 text-caption text-ink-mute">
          {formatDateLong(order.date)} · {itemCount(order)} items · {shops} {shops > 1 ? 'shops' : 'shop'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="font-display text-lg font-bold text-ink tabular-nums">{formatPrice(order.grandTotal)}</p>
        <LuChevronRight className="h-5 w-5 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
    </Link>
  )
}
