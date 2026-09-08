/* ------------------------------------------------------------------ *
 * Domain model — multi-vendor marketplace
 * ------------------------------------------------------------------ */

export type Role = 'customer' | 'vendor' | 'admin'

export interface AuthUser {
  name: string
  email: string
  role: Role
  /** set when role === 'vendor' */
  vendorId?: string
}

export type VendorStatus = 'active' | 'pending' | 'suspended'

export interface Vendor {
  id: string
  slug: string
  name: string
  tagline: string
  bio: string
  logo: string
  banner: string
  location: string
  rating: number
  reviewCount: number
  joinedAt: string
  status: VendorStatus
  ownerEmail: string
  policies: {
    shipping: string
    returns: string
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  description: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  vendorId: string
  rating: number
  reviewCount: number
  /** authoritative on-hand count */
  stock: number
  /** per-product low-stock override; falls back to StoreSettings.lowStockThreshold */
  reorderPoint?: number
  sku: string
  materials: string
  tags: string[]
  featured?: boolean
  createdAt: string
}

/* --------------------------- inventory ---------------------------- */

export type StockMovementReason =
  | 'initial'
  | 'sale'
  | 'return'
  | 'restock'
  | 'adjustment'
  | 'damage'
  | 'correction'

export interface StockMovement {
  id: string
  productId: string
  vendorId: string
  /** signed: -3 for a sale, +10 for a restock */
  delta: number
  /** on-hand after this movement was applied */
  balanceAfter: number
  reason: StockMovementReason
  note?: string
  /** user email, or 'system' */
  actor: string
  /** links sale / return movements back to an order */
  orderNumber?: string
  date: string
}

export interface Review {
  id: string
  productId: string
  author: string
  rating: number
  date: string
  title: string
  comment: string
}

/* ------------------------------- cart ------------------------------ */

export interface CartItem {
  key: string
  productId: string
  vendorId: string
  name: string
  price: number
  image: string
  category: string
  size: string
  color: string
  quantity: number
}

/* ------------------------------ orders ----------------------------- */

export type ShipmentStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'

export interface Shipment {
  vendorId: string
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  status: ShipmentStatus
}

export interface Order {
  orderNumber: string
  email: string
  date: string
  shippingInfo: ShippingInfo
  discountCode?: string
  subtotal: number
  discount: number
  shipping: number
  tax: number
  grandTotal: number
  shipments: Shipment[]
}

/* ---------------------------- checkout ----------------------------- */

export interface ShippingInfo {
  fullName: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
}

export interface PaymentInfo {
  cardName: string
  cardNumber: string
  expiry: string
  cvc: string
}
