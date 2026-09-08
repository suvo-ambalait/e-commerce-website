const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const currencyWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** `$79.99` — the canonical money format across the app. */
export function formatPrice(value: number): string {
  return currency.format(value)
}

/** `$1,240` — used where cents add noise (dashboards, big totals). */
export function formatPriceWhole(value: number): string {
  return currencyWhole.format(value)
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact' })

export function formatCompact(value: number): string {
  return compact.format(value)
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(
    'en-US',
    opts ?? { year: 'numeric', month: 'short', day: 'numeric' },
  )
}

export function formatDateLong(iso: string): string {
  return formatDate(iso, { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Whole-number percent off, e.g. 0.2 -> `20%`. */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

export function discountFraction(price: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= price) return 0
  return (originalPrice - price) / originalPrice
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural
}
