import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'

interface WishlistContextValue {
  productIds: string[]
  count: number
  toggle: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  clear: () => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = usePersistedState<string[]>(storageKeys.wishlist, [])

  const toggle = useCallback(
    (productId: string) =>
      setProductIds((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [productId, ...prev],
      ),
    [setProductIds],
  )

  const isWishlisted = useCallback((productId: string) => productIds.includes(productId), [productIds])
  const clear = useCallback(() => setProductIds([]), [setProductIds])

  const value = useMemo<WishlistContextValue>(
    () => ({ productIds, count: productIds.length, toggle, isWishlisted, clear }),
    [productIds, toggle, isWishlisted, clear],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
