import { createStore } from '@/shared/lib/createStore'

/*
 * Front-end data for marketplace features that don't have backend endpoints
 * yet. Each store is shared across the app and persisted in localStorage.
 * When the API exists, replace a store's reads/writes with requests.
 */

/* ------------------------------ returns ------------------------------ */

export type ReturnKind = 'return' | 'cancel'
export type ReturnStatus = 'Requested' | 'Approved' | 'Rejected' | 'Refunded'
export type ReturnReason =
  | 'Damaged or faulty'
  | 'Wrong item sent'
  | 'Not as described'
  | 'Changed my mind'
  | 'Arrived too late'
  | 'Ordered by mistake'

export const returnReasons: ReturnReason[] = [
  'Damaged or faulty',
  'Wrong item sent',
  'Not as described',
  'Changed my mind',
  'Arrived too late',
  'Ordered by mistake',
]

export interface ReturnRequest {
  id: string
  kind: ReturnKind
  orderNumber: string
  vendorId: string
  email: string
  customerName: string
  items: { key: string; name: string; image: string; quantity: number; price: number }[]
  reason: ReturnReason
  details: string
  resolution: 'Refund' | 'Exchange'
  amount: number
  status: ReturnStatus
  createdAt: string
  updatedAt: string
  /** message from the store shown to the customer */
  note?: string
}

export const returnsStore = createStore<ReturnRequest[]>('marketplace:returns', [])

/* ------------------------------ payouts ------------------------------ */

export type PayoutMethodType = 'bank' | 'bkash' | 'nagad' | 'rocket'

export interface PayoutMethod {
  type: PayoutMethodType
  accountName: string
  accountNumber: string
  bankName?: string
  branch?: string
  routingNumber?: string
  updatedAt: string
}

export const payoutMethodLabel: Record<PayoutMethodType, string> = {
  bank: 'Bank transfer',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
}

export type PayoutStatus = 'Pending' | 'Paid' | 'Rejected'

export interface PayoutRequest {
  id: string
  vendorId: string
  amount: number
  method: PayoutMethod
  status: PayoutStatus
  requestedAt: string
  processedAt?: string
  /** bank or wallet transaction reference, set when paid */
  reference?: string
  note?: string
}

/** keyed by vendor id */
export const payoutMethodsStore = createStore<Record<string, PayoutMethod>>('marketplace:payout-methods', {})
export const payoutRequestsStore = createStore<PayoutRequest[]>('marketplace:payout-requests', [])

/** smallest amount a vendor can withdraw */
export const MIN_WITHDRAWAL = 500

/* ----------------------------- addresses ----------------------------- */

export interface SavedAddress {
  id: string
  label: string
  fullName: string
  phone: string
  address: string
  area: string
  city: string
  zip: string
  country: string
  isDefault: boolean
}

export const addressesStore = createStore<SavedAddress[]>('account:addresses', [])

/* --------------------------- shop settings --------------------------- */

export interface ShopSettings {
  /** business days to pack an order */
  processingDays: number
  shipsFrom: string
  /** delivery zone ids this shop delivers to; empty = all zones */
  zoneIds: string[]
  holiday: { on: boolean; message: string; returnsOn: string }
  notifyNewOrder: boolean
  notifyLowStock: boolean
  notifyReturns: boolean
}

export const defaultShopSettings: ShopSettings = {
  processingDays: 2,
  shipsFrom: '',
  zoneIds: [],
  holiday: { on: false, message: 'We’re taking a short break. Orders placed now ship when we’re back.', returnsOn: '' },
  notifyNewOrder: true,
  notifyLowStock: true,
  notifyReturns: true,
}

/** keyed by vendor id */
export const shopSettingsStore = createStore<Record<string, ShopSettings>>('marketplace:shop-settings', {})

/* -------------------------- vendor discounts ------------------------- */

export interface VendorDiscount {
  id: string
  vendorId: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSpend: number
  expiresOn: string
  active: boolean
  createdAt: string
}

export const vendorDiscountsStore = createStore<VendorDiscount[]>('marketplace:vendor-discounts', [])

/* ------------------------------- staff ------------------------------- */

export type StaffRole = 'Owner' | 'Manager' | 'Support' | 'Content editor' | 'Finance'

export const staffPermissions: Record<StaffRole, string[]> = {
  Owner: ['Everything', 'Staff & roles', 'Settings'],
  Manager: ['Products', 'Orders', 'Vendors', 'Customers', 'Returns', 'Reports'],
  Support: ['Orders', 'Customers', 'Returns'],
  'Content editor': ['Site content', 'Categories', 'Products'],
  Finance: ['Payouts', 'Reports', 'Orders'],
}

export interface StaffMember {
  id: string
  name: string
  email: string
  role: StaffRole
  status: 'Active' | 'Invited' | 'Suspended'
  addedAt: string
  lastActive?: string
}

export const staffStore = createStore<StaffMember[]>('marketplace:staff', () => [
  { id: 'st-owner', name: 'Store owner', email: 'admin@ambalaeshop.test', role: 'Owner', status: 'Active', addedAt: '2024-01-10T09:00:00.000Z', lastActive: new Date().toISOString() },
])

/* --------------------------- delivery zones -------------------------- */

export interface DeliveryZone {
  id: string
  name: string
  /** cities or districts covered, comma separated for display */
  areas: string
  rate: number
  /** per-shop basket at or above this ships free; 0 = never free */
  freeOver: number
  minDays: number
  maxDays: number
  codAvailable: boolean
  active: boolean
}

export const zonesStore = createStore<DeliveryZone[]>('marketplace:zones', () => [
  { id: 'z-dhaka', name: 'Inside Dhaka', areas: 'Dhaka City Corporation', rate: 60, freeOver: 1500, minDays: 1, maxDays: 2, codAvailable: true, active: true },
  { id: 'z-suburb', name: 'Dhaka suburbs', areas: 'Gazipur, Narayanganj, Savar, Keraniganj', rate: 100, freeOver: 2000, minDays: 2, maxDays: 3, codAvailable: true, active: true },
  { id: 'z-outside', name: 'Outside Dhaka', areas: 'All other districts', rate: 130, freeOver: 3000, minDays: 3, maxDays: 5, codAvailable: true, active: true },
])

/* ---------------------------- site content --------------------------- */

export type PolicySlug = 'shipping-returns' | 'faq' | 'terms' | 'privacy'

export interface SiteContent {
  announcement: { on: boolean; text: string; link: string }
  banners: { id: string; title: string; subtitle: string; image: string; link: string; active: boolean }[]
  pages: Record<PolicySlug, { title: string; intro: string; sections: { heading: string; body: string }[]; updatedAt: string }>
  contact: { hours: string; whatsapp: string; mapNote: string }
}

const today = new Date().toISOString()

export const defaultContent: SiteContent = {
  announcement: { on: true, text: 'Cash on delivery available across Bangladesh', link: '/shipping-returns' },
  banners: [
    { id: 'b-1', title: 'Eid collection is here', subtitle: 'Handmade gifts from independent shops', image: '', link: '/shop', active: true },
    { id: 'b-2', title: 'Pay with bKash or Nagad', subtitle: 'Or cash on delivery — your choice', image: '', link: '/shipping-returns', active: false },
  ],
  pages: {
    'shipping-returns': {
      title: 'Delivery & returns',
      intro: 'Every shop on AmbalaEshop packs and sends its own parcel. Here is how delivery, cash on delivery and returns work.',
      sections: [
        { heading: 'Delivery areas and times', body: 'Inside Dhaka usually arrives in 1–2 days. Dhaka suburbs take 2–3 days, and the rest of Bangladesh 3–5 days. Each shop adds its own packing time, shown on the product page.' },
        { heading: 'Delivery charges', body: 'Charges depend on your delivery area and are shown at checkout before you pay. Each shop’s parcel ships free once it passes that area’s free-delivery amount.' },
        { heading: 'Cash on delivery', body: 'You can pay the courier in cash when your parcel arrives. Please keep the exact amount ready. Parcels from different shops may arrive separately, and you pay for each when it arrives.' },
        { heading: 'Returns', body: 'You can ask for a return within 7 days of delivery from your account’s order page. Items must be unused and in their original packaging. Once the shop receives the item, we refund you within 5–7 working days.' },
        { heading: 'Cancellations', body: 'You can cancel a parcel for free until the shop marks it as shipped.' },
      ],
      updatedAt: today,
    },
    faq: {
      title: 'Frequently asked questions',
      intro: 'Quick answers about orders, payments and selling on AmbalaEshop.',
      sections: [
        { heading: 'Why did my order arrive in separate parcels?', body: 'Each shop ships its own items directly, so an order from three shops arrives as three parcels.' },
        { heading: 'Which payment methods can I use?', body: 'Cash on delivery, bKash, Nagad and debit or credit cards.' },
        { heading: 'How do I track my order?', body: 'Open “Track an order” and enter your order number and email, or see it in your account.' },
        { heading: 'How do I return something?', body: 'Go to your order in your account and choose “Request a return” on the parcel. See Delivery & returns for the full policy.' },
        { heading: 'How can I sell on AmbalaEshop?', body: 'Apply through “Sell on AmbalaEshop”. We review every application, usually within a week.' },
      ],
      updatedAt: today,
    },
    terms: {
      title: 'Terms of service',
      intro: 'These terms apply when you shop or sell on AmbalaEshop. Please read them carefully.',
      sections: [
        { heading: 'Using AmbalaEshop', body: 'AmbalaEshop is a marketplace. Products are sold by independent shops, and each shop is responsible for its own products and delivery.' },
        { heading: 'Orders and prices', body: 'Prices are in Bangladeshi taka and include VAT where shown. An order is confirmed when you receive a confirmation with an order number.' },
        { heading: 'Your account', body: 'Keep your sign-in details private. You are responsible for activity on your account.' },
        { heading: 'Changes to these terms', body: 'We may update these terms. The date at the top shows when they last changed.' },
      ],
      updatedAt: today,
    },
    privacy: {
      title: 'Privacy policy',
      intro: 'This explains what information we collect and how we use it.',
      sections: [
        { heading: 'What we collect', body: 'Your name, phone number, email and delivery address when you order, plus the items you buy.' },
        { heading: 'How we use it', body: 'To deliver your orders, contact you about them, and improve the store. Shops only see what they need to send your parcel.' },
        { heading: 'Who we share it with', body: 'The shop you bought from and the courier delivering your parcel. We never sell your information.' },
        { heading: 'Your choices', body: 'You can update your details in your account at any time, or contact us to delete your account.' },
      ],
      updatedAt: today,
    },
  },
  contact: {
    hours: 'Saturday to Thursday, 10am – 7pm',
    whatsapp: '',
    mapNote: '',
  },
}

export const contentStore = createStore<SiteContent>('marketplace:content', defaultContent)

/* -------------------------- contact messages ------------------------- */

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string
  topic: string
  orderNumber: string
  message: string
  createdAt: string
  read: boolean
}

export const messagesStore = createStore<ContactMessage[]>('marketplace:messages', [])

/* ----------------------- vendor notifications ------------------------ */

/** ids of vendor notifications already read, keyed by vendor id */
export const vendorReadStore = createStore<Record<string, string[]>>('marketplace:vendor-read', {})
