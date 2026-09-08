import type { ReactNode } from 'react'
import { Button, Input } from '@/shared/ui'
import { formatPrice } from '@/shared/lib/format'
import type { useCartPricing } from '../lib/useCartPricing'

type Pricing = ReturnType<typeof useCartPricing>

export function OrderSummary({
  pricing,
  showPromo = true,
  footer,
}: {
  pricing: Pricing
  showPromo?: boolean
  footer?: ReactNode
}) {
  const { totals } = pricing

  return (
    <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-sm font-medium uppercase tracking-wide text-ink-soft">Summary</h2>

      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
        {totals.discount > 0 && (
          <Row label={`Discount ${pricing.discountLabel ? `(${pricing.discountLabel})` : ''}`} value={`−${formatPrice(totals.discount)}`} accent />
        )}
        <Row label="Shipping" value={totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)} />
        <Row label="Tax (est.)" value={formatPrice(totals.tax)} />
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-sm font-medium text-ink">Total</span>
        <span className="font-serif text-xl text-ink">{formatPrice(totals.grandTotal)}</span>
      </div>

      {totals.shipments.length > 1 && (
        <p className="mt-2 text-caption text-ink-mute">
          Ships as {totals.shipments.length} parcels — shipping is calculated per maker.
        </p>
      )}

      {showPromo && (
        <div className="mt-5 border-t border-border pt-4">
          {pricing.appliedCode ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-success">Code {pricing.appliedCode} applied</span>
              <button type="button" onClick={pricing.clear} className="text-caption text-ink-mute hover:text-danger">
                Remove
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                pricing.apply()
              }}
              className="flex gap-2"
            >
              <Input
                value={pricing.code}
                onChange={(e) => pricing.setCode(e.target.value)}
                placeholder="Promo code"
                className="h-10"
              />
              <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                Apply
              </Button>
            </form>
          )}
          {pricing.error && <p className="mt-1.5 text-caption text-danger">{pricing.error}</p>}
          {!pricing.appliedCode && !pricing.error && (
            <p className="mt-1.5 text-caption text-ink-mute">Try WELCOME15</p>
          )}
        </div>
      )}

      {footer && <div className="mt-5">{footer}</div>}
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={accent ? 'tabular-nums text-accent' : 'tabular-nums text-ink'}>{value}</dd>
    </div>
  )
}
