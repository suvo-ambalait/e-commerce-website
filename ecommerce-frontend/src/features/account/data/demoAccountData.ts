import type { Order, OrderPayment, Shipment, ShipmentStatus } from '@/shared/types'
import { seedProducts } from '@/features/catalog/data/products'
import { seedOrders } from '@/features/orders/data/seedOrders'
import { addressesStore, returnsStore, type ReturnRequest, type SavedAddress } from '@/features/marketplace/stores'
import { storageKeys } from '@/shared/lib/storage'

/*
 * Demo data for the customer account pages (jordan@example.com), so every page
 * can be checked with realistic content: orders in every status, saved
 * addresses, wishlist items and returns in every status.
 *
 * It is merged into localStorage once per browser. It never overwrites or
 * removes anything already there. To load it again, remove the
 * `demo:account-v1` key from localStorage and reload.
 *
 * Delete this file and its call in app/main.tsx once the account pages use the API.
 */

const FLAG = 'demo:account-v1'
const EMAIL = 'jordan@example.com'
const NAME = 'Jordan Rivera'

function daysAgo(n: number, hour = 11): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 30, 0, 0)
  return d.toISOString()
}

const round = (n: number) => Math.round(n * 100) / 100

function line(productId: string, quantity = 1, size = 'One size', color = 'Natural') {
  const p = seedProducts.find((x) => x.id === productId)!
  return {
    key: `${p.id}::${size}::${color}`,
    productId: p.id,
    vendorId: p.vendorId,
    name: p.name,
    price: p.price,
    image: p.images[0],
    category: p.category,
    size,
    color,
    quantity,
  }
}

/** One shop's parcel. All items must come from the same vendor. */
function parcel(status: ShipmentStatus, ...items: ReturnType<typeof line>[]): Shipment {
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0)
  const shipping = subtotal >= 100 ? 0 : 6
  const tax = round(subtotal * 0.08)
  return { vendorId: items[0].vendorId, items, subtotal, shipping, tax, discount: 0, total: round(subtotal + shipping + tax), status }
}

const homeAddress = {
  fullName: NAME,
  address: 'House 12, Road 7, Block C',
  city: 'Dhaka',
  state: 'Banani',
  zip: '1213',
  country: 'Bangladesh',
  phone: '+880 1711-234567',
}

function order(orderNumber: string, days: number, payment: OrderPayment, ...shipments: Shipment[]): Order {
  const sum = (k: 'subtotal' | 'shipping' | 'tax' | 'discount') => round(shipments.reduce((n, s) => n + s[k], 0))
  const subtotal = sum('subtotal')
  const shipping = sum('shipping')
  const tax = sum('tax')
  return {
    orderNumber,
    email: EMAIL,
    date: daysAgo(days),
    shippingInfo: homeAddress,
    payment,
    zoneName: 'Inside Dhaka',
    subtotal,
    discount: 0,
    shipping,
    tax,
    grandTotal: round(subtotal + shipping + tax),
    shipments,
  }
}

const cod: OrderPayment = { method: 'cod', status: 'Due on delivery' }
const bkash = (reference: string): OrderPayment => ({ method: 'bkash', status: 'Paid', reference })
const nagad = (reference: string): OrderPayment => ({ method: 'nagad', status: 'Paid', reference })

const demoOrders: Order[] = [
  // just placed, nothing shipped yet
  order('MSN-004860', 0, cod, parcel('Processing', line('p38', 2)), parcel('Processing', line('p20', 1), line('p24', 1))),
  // one parcel shipped, one still being packed
  order('MSN-004845', 4, bkash('BK8H3K2QZ1'), parcel('Shipped', line('p14', 1)), parcel('Processing', line('p33', 2))),
  order('MSN-004733', 16, nagad('NG71C4MX09'), parcel('Delivered', line('p26', 1), line('p25', 2))),
  order('MSN-004690', 24, cod, parcel('Cancelled', line('p2', 1))),
  order('MSN-004655', 35, bkash('BK2P9D7LW4'), parcel('Delivered', line('p19', 1)), parcel('Delivered', line('p37', 1))),
  order('MSN-004612', 48, cod, parcel('Delivered', line('p9', 1), line('p10', 1))),
]

const demoAddresses: SavedAddress[] = [
  {
    id: 'addr-demo-home',
    label: 'Home',
    fullName: NAME,
    phone: homeAddress.phone,
    address: homeAddress.address,
    area: 'Banani',
    city: 'Dhaka',
    zip: '1213',
    country: 'Bangladesh',
    isDefault: true,
  },
  {
    id: 'addr-demo-office',
    label: 'Office',
    fullName: NAME,
    phone: '+880 1819-765432',
    address: 'Level 9, Gulshan Tower, 31 Gulshan Avenue',
    area: 'Gulshan 1',
    city: 'Dhaka',
    zip: '1212',
    country: 'Bangladesh',
    isDefault: false,
  },
  {
    id: 'addr-demo-parents',
    label: 'Parents',
    fullName: 'Nasrin Rivera',
    phone: '+880 1552-908172',
    address: '45 Jamal Khan Road',
    area: 'Jamal Khan',
    city: 'Chattogram',
    zip: '4000',
    country: 'Bangladesh',
    isDefault: false,
  },
]

const demoWishlist = ['p4', 'p14', 'p22', 'p33', 'p38', 'p42']

function returnItem(productId: string, quantity = 1) {
  const l = line(productId, quantity)
  return { key: l.key, name: l.name, image: l.image, quantity, price: l.price }
}

function demoReturn(
  id: string,
  orderNumber: string,
  productId: string,
  status: ReturnRequest['status'],
  reason: ReturnRequest['reason'],
  details: string,
  resolution: ReturnRequest['resolution'],
  created: number,
  updated: number,
  note?: string,
): ReturnRequest {
  const item = returnItem(productId)
  return {
    id,
    kind: 'return',
    orderNumber,
    vendorId: seedProducts.find((p) => p.id === productId)!.vendorId,
    email: EMAIL,
    customerName: NAME,
    items: [item],
    reason,
    details,
    resolution,
    amount: item.price * item.quantity,
    status,
    createdAt: daysAgo(created),
    updatedAt: daysAgo(updated, 15),
    note,
  }
}

const demoReturns: ReturnRequest[] = [
  demoReturn(
    'ret-demo-01',
    'MSN-004655',
    'p37',
    'Requested',
    'Damaged or faulty',
    'The pot arrived cracked along one side and soil spilled into the box.',
    'Refund',
    2,
    2,
  ),
  demoReturn(
    'ret-demo-02',
    'MSN-004752',
    'p31',
    'Approved',
    'Wrong item sent',
    'I ordered the Hinoki scent but received Cedar.',
    'Exchange',
    6,
    5,
    'Sorry about the mix-up. A courier will collect the bottle and drop off the right one.',
  ),
  demoReturn(
    'ret-demo-03',
    'MSN-004612',
    'p9',
    'Refunded',
    'Not as described',
    'The glaze colour is much darker than in the photos.',
    'Refund',
    40,
    36,
    'Refund sent to your original payment method.',
  ),
  demoReturn(
    'ret-demo-04',
    'MSN-004733',
    'p26',
    'Rejected',
    'Changed my mind',
    'I found a pen I like more.',
    'Refund',
    9,
    8,
    'This pen has been used, so we can’t accept it back. Sorry!',
  ),
]

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw !== null ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/** Merge the demo account data into localStorage once. Call before the app renders. */
export function loadDemoAccountData() {
  try {
    if (window.localStorage.getItem(FLAG)) return

    // orders and wishlist are read by their providers on mount, so write storage directly
    const orders = readJson<Order[]>(storageKeys.orders, seedOrders)
    const known = new Set(orders.map((o) => o.orderNumber))
    const merged = [...orders, ...demoOrders.filter((o) => !known.has(o.orderNumber))].sort((a, b) =>
      b.date.localeCompare(a.date),
    )
    window.localStorage.setItem(storageKeys.orders, JSON.stringify(merged))

    const wishlist = readJson<string[]>(storageKeys.wishlist, [])
    if (wishlist.length === 0) window.localStorage.setItem(storageKeys.wishlist, JSON.stringify(demoWishlist))

    // these stores are already loaded, so update them through the store
    addressesStore.set((prev) => (prev.length ? prev : demoAddresses))
    returnsStore.set((prev) => {
      const ids = new Set(prev.map((r) => r.id))
      return [...demoReturns.filter((r) => !ids.has(r.id)), ...prev]
    })

    window.localStorage.setItem(FLAG, new Date().toISOString())
  } catch {
    /* storage unavailable: skip demo data */
  }
}
