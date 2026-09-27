import { useMemo, useState } from 'react'
import { calculateCartTotals } from '@/shared/lib/pricing'
import { useCart } from '../context/CartContext'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { useDiscounts } from '@/features/admin/context/DiscountsContext'

/** the applied promo code survives cart → checkout navigation for this browser session */
const PROMO_KEY = 'cart:promo'

function readPromo(): string | null {
  try {
    return window.sessionStorage.getItem(PROMO_KEY)
  } catch {
    return null
  }
}

function writePromo(code: string | null) {
  try {
    if (code) window.sessionStorage.setItem(PROMO_KEY, code)
    else window.sessionStorage.removeItem(PROMO_KEY)
  } catch {
    /* storage unavailable — the code just won't persist */
  }
}

export function useCartPricing() {
  const { groups } = useCart()
  const { settings } = useSettings()
  const { findActiveDiscount } = useDiscounts()

  const [code, setCode] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(readPromo)
  const [error, setError] = useState<string | null>(null)

  const discount = appliedCode ? findActiveDiscount(appliedCode) : undefined
  const discountRate = discount?.discountPercent ?? 0

  const totals = useMemo(
    () =>
      calculateCartTotals(
        groups.map((g) => ({ vendorId: g.vendorId, subtotal: g.subtotal })),
        discountRate,
        settings,
      ),
    [groups, discountRate, settings],
  )

  const apply = (raw?: string) => {
    const value = (raw ?? code).trim()
    if (!value) return
    if (findActiveDiscount(value)) {
      setAppliedCode(value.toUpperCase())
      writePromo(value.toUpperCase())
      setError(null)
    } else {
      setError('That code isn’t valid.')
      setAppliedCode(null)
      writePromo(null)
    }
  }

  const clear = () => {
    setAppliedCode(null)
    writePromo(null)
    setCode('')
    setError(null)
  }

  return {
    totals,
    code,
    setCode,
    appliedCode,
    discountLabel: discount ? `${Math.round(discount.discountPercent * 100)}% off` : null,
    error,
    apply,
    clear,
    freeShippingThreshold: settings.freeShippingThreshold,
  }
}
