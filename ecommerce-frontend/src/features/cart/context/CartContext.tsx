import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'
import type { CartItem, Product } from '@/shared/types'

export interface VendorGroup {
  vendorId: string
  items: CartItem[]
  subtotal: number
}

interface AddOptions {
  size?: string
  color?: string
  quantity?: number
}

interface CartContextValue {
  items: CartItem[]
  groups: VendorGroup[]
  totalItems: number
  subtotal: number
  addItem: (product: Product, options?: AddOptions) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = usePersistedState<CartItem[]>(storageKeys.cart, [])

  const addItem = useCallback<CartContextValue['addItem']>(
    (product, options = {}) => {
      const size = options.size ?? 'One size'
      const color = options.color ?? 'Natural'
      const quantity = options.quantity ?? 1
      const key = `${product.id}::${size}::${color}`
      setItems((prev) => {
        const existing = prev.find((i) => i.key === key)
        if (existing) {
          return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
        }
        return [
          ...prev,
          {
            key,
            productId: product.id,
            vendorId: product.vendorId,
            name: product.name,
            price: product.price,
            image: product.images[0],
            category: product.category,
            size,
            color,
            quantity,
          },
        ]
      })
    },
    [setItems],
  )

  const removeItem = useCallback(
    (key: string) => setItems((prev) => prev.filter((i) => i.key !== key)),
    [setItems],
  )

  const updateQuantity = useCallback(
    (key: string, quantity: number) => {
      if (quantity < 1) return
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)))
    },
    [setItems],
  )

  const clearCart = useCallback(() => setItems([]), [setItems])

  const groups = useMemo<VendorGroup[]>(() => {
    const map = new Map<string, CartItem[]>()
    for (const item of items) {
      const list = map.get(item.vendorId) ?? []
      list.push(item)
      map.set(item.vendorId, list)
    }
    return [...map.entries()].map(([vendorId, groupItems]) => ({
      vendorId,
      items: groupItems,
      subtotal: groupItems.reduce((s, i) => s + i.price * i.quantity, 0),
    }))
  }, [items])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      groups,
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, groups, addItem, removeItem, updateQuantity, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
