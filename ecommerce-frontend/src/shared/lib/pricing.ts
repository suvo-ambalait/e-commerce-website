export interface ShippingTaxRates {
  shippingFlatRate: number
  freeShippingThreshold: number
  taxRate: number
}

export interface LineTotals {
  discount: number
  shipping: number
  tax: number
  total: number
}

/**
 * Totals for a single basket / vendor shipment.
 * `discountRate` is a fraction (0.2 === 20% off the subtotal).
 */
export function calculateOrderTotals(
  subtotal: number,
  discountRate: number,
  rates: ShippingTaxRates,
): LineTotals {
  const discount = round(subtotal * discountRate)
  const discountedSubtotal = subtotal - discount
  const shipping =
    discountedSubtotal <= 0 || discountedSubtotal >= rates.freeShippingThreshold
      ? 0
      : rates.shippingFlatRate
  const tax = round(discountedSubtotal * rates.taxRate)
  const total = round(discountedSubtotal + shipping + tax)
  return { discount, shipping, tax, total }
}

export interface VendorBasket {
  vendorId: string
  subtotal: number
}

export interface ShipmentTotals extends LineTotals {
  vendorId: string
  subtotal: number
}

export interface CartTotals {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  grandTotal: number
  shipments: ShipmentTotals[]
}

/**
 * Marketplace checkout: each vendor ships independently, so shipping and the
 * free-shipping threshold apply per vendor. The discount fraction is applied
 * across every vendor basket.
 */
export function calculateCartTotals(
  baskets: VendorBasket[],
  discountRate: number,
  rates: ShippingTaxRates,
): CartTotals {
  const shipments = baskets.map<ShipmentTotals>((basket) => {
    const totals = calculateOrderTotals(basket.subtotal, discountRate, rates)
    return { vendorId: basket.vendorId, subtotal: basket.subtotal, ...totals }
  })

  return {
    subtotal: round(sum(shipments.map((s) => s.subtotal))),
    discount: round(sum(shipments.map((s) => s.discount))),
    shipping: round(sum(shipments.map((s) => s.shipping))),
    tax: round(sum(shipments.map((s) => s.tax))),
    grandTotal: round(sum(shipments.map((s) => s.total))),
    shipments,
  }
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
