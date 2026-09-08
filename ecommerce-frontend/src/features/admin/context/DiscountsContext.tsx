import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'

export interface Discount {
  code: string
  discountPercent: number
  active: boolean
}

interface DiscountsContextValue {
  discounts: Discount[]
  addDiscount: (discount: Discount) => void
  updateDiscount: (code: string, discount: Discount) => void
  deleteDiscount: (code: string) => void
  findActiveDiscount: (code: string) => Discount | undefined
}

const defaultDiscounts: Discount[] = [
  { code: 'WELCOME15', discountPercent: 0.15, active: true },
  { code: 'MAKERS10', discountPercent: 0.1, active: true },
]

const DiscountsContext = createContext<DiscountsContextValue | null>(null)

export function DiscountsProvider({ children }: { children: ReactNode }) {
  const [discounts, setDiscounts] = usePersistedState<Discount[]>(storageKeys.discounts, defaultDiscounts)

  const addDiscount = useCallback(
    (discount: Discount) => setDiscounts((prev) => [...prev, discount]),
    [setDiscounts],
  )
  const updateDiscount = useCallback(
    (code: string, discount: Discount) =>
      setDiscounts((prev) => prev.map((d) => (d.code === code ? discount : d))),
    [setDiscounts],
  )
  const deleteDiscount = useCallback(
    (code: string) => setDiscounts((prev) => prev.filter((d) => d.code !== code)),
    [setDiscounts],
  )
  const findActiveDiscount = useCallback(
    (code: string) =>
      discounts.find((d) => d.active && d.code.toLowerCase() === code.trim().toLowerCase()),
    [discounts],
  )

  const value = useMemo<DiscountsContextValue>(
    () => ({ discounts, addDiscount, updateDiscount, deleteDiscount, findActiveDiscount }),
    [discounts, addDiscount, updateDiscount, deleteDiscount, findActiveDiscount],
  )

  return <DiscountsContext.Provider value={value}>{children}</DiscountsContext.Provider>
}

export function useDiscounts(): DiscountsContextValue {
  const ctx = useContext(DiscountsContext)
  if (!ctx) throw new Error('useDiscounts must be used within a DiscountsProvider')
  return ctx
}
