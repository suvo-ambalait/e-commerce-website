import type { ReactNode } from 'react'
import { ThemeProvider } from '@/shared/hooks/useTheme'
import { ToastProvider } from '@/shared/ui/Toast'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { VendorProvider } from '@/features/vendor/context/VendorContext'
import { CatalogProvider } from '@/features/catalog/context/CatalogContext'
import { SettingsProvider } from '@/features/admin/context/SettingsContext'
import { DiscountsProvider } from '@/features/admin/context/DiscountsContext'
import { OrdersProvider } from '@/features/orders/context/OrdersContext'
import { InventoryProvider } from '@/features/inventory/context/InventoryContext'
import { CartProvider } from '@/features/cart/context/CartContext'
import { WishlistProvider } from '@/features/account/context/WishlistContext'

/** Compose every context provider in one place, outermost first. */
export function AppProviders({ children }: { children: ReactNode }) {
  const providers = [
    ThemeProvider,
    ToastProvider,
    SettingsProvider,
    AuthProvider,
    VendorProvider,
    CatalogProvider,
    DiscountsProvider,
    OrdersProvider,
    InventoryProvider,
    CartProvider,
    WishlistProvider,
  ]

  return providers.reduceRight(
    (tree, Provider) => <Provider>{tree}</Provider>,
    children,
  ) as React.JSX.Element
}
