/**
 * One-time storage reset. The data model changed shape when the app became a
 * marketplace (products gained vendorId, orders gained shipments, …), so any
 * cart/catalog saved under the old schema would crash the new code. Bumping
 * SCHEMA_VERSION clears every app key on next load.
 */
const SCHEMA_KEY = 'maison:schema'
const SCHEMA_VERSION = '5'

export const storageKeys = {
  theme: 'maison:theme',
  auth: 'maison:auth:user',
  users: 'maison:auth:users',
  vendors: 'maison:vendors',
  products: 'maison:catalog:products',
  categories: 'maison:catalog:categories',
  reviews: 'maison:catalog:reviews',
  cart: 'maison:cart',
  orders: 'maison:orders',
  movements: 'maison:inventory:movements',
  wishlist: 'maison:wishlist',
  settings: 'maison:settings',
  discounts: 'maison:discounts',
} as const

export function ensureSchema(): void {
  try {
    if (window.localStorage.getItem(SCHEMA_KEY) !== SCHEMA_VERSION) {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith('maison:') || k.startsWith('ecommerce-'))
        .forEach((k) => window.localStorage.removeItem(k))
      window.localStorage.setItem(SCHEMA_KEY, SCHEMA_VERSION)
    }
    applyDemoRole()
    const theme = new URLSearchParams(window.location.search).get('theme')
    if (theme === 'dark' || theme === 'light' || theme === 'system') {
      window.localStorage.setItem(storageKeys.theme, JSON.stringify(theme))
    }
  } catch {
    /* storage unavailable */
  }
}

/**
 * `?as=admin` / `?as=vendor` / `?as=customer` pre-seeds the signed-in account
 * before React renders, so route guards see it on the first paint. Handy for
 * demoing the marketplace from a single link.
 */
function applyDemoRole(): void {
  const as = new URLSearchParams(window.location.search).get('as')
  if (!as) return
  const account =
    as === 'admin'
      ? { name: 'Platform Admin', email: 'admin@morerdokan.example', role: 'admin' }
      : as === 'vendor'
        ? { name: 'Lumen Atelier Studio', email: 'studio@lumen.example', role: 'vendor', vendorId: 'v-lumen' }
        : { name: 'Jordan Rivera', email: 'jordan@example.com', role: 'customer' }
  window.localStorage.setItem(storageKeys.auth, JSON.stringify(account))

  // `?as=customer` also drops two pieces from different makers into the cart so
  // the multi-vendor cart / checkout can be demoed straight away.
  if (as === 'customer' && !window.localStorage.getItem(storageKeys.cart)) {
    window.localStorage.setItem(
      storageKeys.cart,
      JSON.stringify([
        {
          key: 'p2::One size::Natural',
          productId: 'p2',
          vendorId: 'v-lumen',
          name: 'Column Floor Light',
          price: 545,
          image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=500&fit=crop&q=70&auto=format',
          category: 'Lighting',
          size: 'One size',
          color: 'Natural',
          quantity: 1,
        },
        {
          key: 'p9::One size::Natural',
          productId: 'p9',
          vendorId: 'v-terra',
          name: 'Serving Bowl, Large',
          price: 74,
          image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=500&fit=crop&q=70&auto=format',
          category: 'Tableware',
          size: 'One size',
          color: 'Natural',
          quantity: 2,
        },
      ]),
    )
  }

  const url = new URL(window.location.href)
  url.searchParams.delete('as')
  window.history.replaceState({}, '', url)
}
