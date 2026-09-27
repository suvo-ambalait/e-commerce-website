import type { ReactNode } from 'react'
import { formatPrice } from '@/shared/lib/format'
import { CloseIcon } from '@/shared/ui/icons'
import type { useCartPricing } from '../lib/useCartPricing'

type Pricing = ReturnType<typeof useCartPricing>

/**
 * Dark order-summary panel used by the cart and checkout pages.
 * Fixed colours so it reads as a dark block in both themes; border colours
 * carry `!` to beat the global `* { border-color }` rule in index.css.
 */
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
  const parcels = totals.shipments.length

  return (
    <div className="rounded-3xl bg-[#0b0a10] p-6 text-white ring-1 ring-transparent dark:ring-white/10">
      <h2 className="font-sans! text-[11px] font-semibold! uppercase tracking-[0.14em]! text-[#a78bfa]">
        Order summary
      </h2>

      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
        {totals.discount > 0 && (
          <Row
            label={`Discount${pricing.discountLabel ? ` · ${pricing.discountLabel}` : ''}`}
            value={`−${formatPrice(totals.discount)}`}
          />
        )}
        <Row
          label={`Shipping · ${parcels} ${parcels === 1 ? 'parcel' : 'parcels'}`}
          value={totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}
        />
        <Row label="Tax (est.)" value={formatPrice(totals.tax)} />
      </dl>

      <div className="mt-5 flex items-end justify-between border-t border-white/10! pt-5">
        <span className="text-sm font-semibold">Total</span>
        <span className="font-display text-[2rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
          {formatPrice(totals.grandTotal)}
        </span>
      </div>
      <p className="mt-3 text-caption text-[#8a849c]">
        Shipping is calculated per maker — each studio sends its own parcel.
      </p>

      {showPromo && (
        <div className="mt-5">
          <p className="text-caption font-semibold">Promo code</p>
          {pricing.appliedCode ? (
            <div className="mt-2 flex h-11 items-center justify-between rounded-full bg-[#6d28d9]/25 pl-4 pr-1.5 text-sm">
              <span className="font-semibold text-[#c4b5fd]">
                {pricing.appliedCode} applied{pricing.discountLabel ? ` · ${pricing.discountLabel}` : ''}
              </span>
              <button
                type="button"
                onClick={pricing.clear}
                aria-label="Remove promo code"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#c4b5fd] transition-colors hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                pricing.apply()
              }}
              className="mt-2 flex h-11 items-center gap-2 rounded-full bg-white/[0.06] p-1 pl-4 ring-1 ring-white/10 focus-within:ring-[#a78bfa]"
            >
              <input
                value={pricing.code}
                onChange={(e) => pricing.setCode(e.target.value)}
                placeholder="ENTER CODE"
                aria-label="Promo code"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm uppercase tracking-wide text-white outline-none placeholder:text-[#8a849c] focus:ring-0"
              />
              <button
                type="submit"
                className="h-full shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#0b0a10] transition-colors hover:bg-[#ede9fe]"
              >
                Apply
              </button>
            </form>
          )}
          {pricing.error ? (
            <p className="mt-2 text-caption text-[#f08a9b]">{pricing.error}</p>
          ) : (
            !pricing.appliedCode && (
              <p className="mt-2 text-caption text-[#8a849c]">Try WELCOME15 for 15% off your first order</p>
            )
          )}
        </div>
      )}

      {footer && <div className="mt-6">{footer}</div>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#b8b3c7]">{label}</dt>
      <dd className="font-semibold text-[#c4b5fd] tabular-nums">{value}</dd>
    </div>
  )
}
