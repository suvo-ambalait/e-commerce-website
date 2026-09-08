import { Link } from 'react-router-dom'
import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatDate } from '@/shared/lib/format'
import { useInventory } from '../context/InventoryContext'
import { reasonLabel, reasonTone } from '../lib/status'

export function StockHistory({ productId, limit }: { productId: string; limit?: number }) {
  const { movementsFor } = useInventory()
  const all = movementsFor(productId)
  const rows = limit ? all.slice(0, limit) : all

  if (rows.length === 0) {
    return <p className="text-caption text-ink-mute">No movements recorded yet.</p>
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((m) => (
        <li key={m.id} className="flex items-center gap-3 py-2.5">
          <Badge tone={reasonTone[m.reason]}>{reasonLabel[m.reason]}</Badge>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption text-ink-soft">
              {m.note ??
                (m.orderNumber ? (
                  <Link to={`/admin/orders/${m.orderNumber}`} className="text-accent hover:underline">
                    {m.orderNumber}
                  </Link>
                ) : (
                  '—'
                ))}
            </p>
            <p className="text-[0.6875rem] text-ink-mute">
              {formatDate(m.date)} · {m.actor}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 text-sm font-medium tabular-nums',
              m.delta > 0 ? 'text-success' : m.delta < 0 ? 'text-danger' : 'text-ink-mute',
            )}
          >
            {m.delta > 0 ? '+' : ''}
            {m.delta}
          </span>
          <span className="w-12 shrink-0 text-right text-caption tabular-nums text-ink-mute">
            {m.balanceAfter}
          </span>
        </li>
      ))}
      {limit && all.length > limit && (
        <li className="pt-2 text-caption text-ink-mute">+ {all.length - limit} earlier movements</li>
      )}
    </ul>
  )
}
