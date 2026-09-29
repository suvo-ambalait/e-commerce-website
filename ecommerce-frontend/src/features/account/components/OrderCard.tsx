import { Link } from 'react-router-dom'
import { LuChevronRight } from 'react-icons/lu'
import { Badge, Money } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatDateLong } from '@/shared/lib/format'
import type { Order } from '@/shared/types'
import { itemCount, orderProgress, progressTone } from '../lib/useCustomer'

/**
 * One order in the customer's list: thumbnails, number, date, status and total.
 * `flat` drops the card border so it can sit as a row inside another card.
 */
export function OrderCard({ order, flat = false }: { order: Order; flat?: boolean }) {
  const items = order.shipments.flatMap((s) => s.items)
  const progress = orderProgress(order)
  const shops = order.shipments.length
  const count = itemCount(order)

  return (
    <Link
      to={`/account/orders/${order.orderNumber}`}
      className={cn(
        'group flex flex-wrap items-center gap-4 sm:flex-nowrap',
        flat
          ? '-mx-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-surface-sunken'
          : 'rounded-2xl border border-border bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-accent/40! hover:shadow-md',
      )}
    >
      {/* fixed width (room for 3 tiles) so every row's text lines up */}
      <div className="flex w-36 shrink-0 -space-x-3">
        {items.slice(0, items.length > 3 ? 2 : 3).map((i) => (
          <img key={i.key} src={i.image} alt="" className="h-14 w-14 rounded-xl object-cover ring-2 ring-surface" />
        ))}
        {items.length > 3 && (
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-soft text-caption font-semibold text-accent ring-2 ring-surface">
            +{items.length - 2}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display font-bold text-ink group-hover:text-accent">{order.orderNumber}</p>
          <Badge tone={progressTone[progress]}>{progress}</Badge>
        </div>
        <p className="mt-0.5 text-caption text-ink-mute">
          {formatDateLong(order.date)} · {count} {count === 1 ? 'item' : 'items'} · {shops} {shops > 1 ? 'shops' : 'shop'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Money value={order.grandTotal} className="font-display text-lg font-bold text-ink" />
        <LuChevronRight className="h-5 w-5 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
    </Link>
  )
}
