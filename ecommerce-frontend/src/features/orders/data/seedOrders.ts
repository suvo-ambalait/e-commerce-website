import type { Order } from '@/shared/types'
import { seedProducts } from '@/features/catalog/data/products'

/** A few historical orders so dashboards and charts aren't empty on first run. */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(11, 30, 0, 0)
  return d.toISOString()
}

function line(productId: string, quantity: number, size = 'One size', color = 'Natural') {
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

const address = {
  fullName: 'Jordan Rivera',
  address: '221 Baker Street',
  city: 'Portland',
  state: 'OR',
  zip: '97205',
  country: 'United States',
  phone: '+1 555 0142',
}

const address2 = { ...address, fullName: 'Priya Anand', city: 'Austin', state: 'TX', zip: '78701' }

export const seedOrders: Order[] = [
  {
    orderNumber: 'MSN-004821',
    email: 'jordan@example.com',
    date: daysAgo(2),
    shippingInfo: address,
    subtotal: 337,
    discount: 0,
    shipping: 0,
    tax: 26.96,
    grandTotal: 363.96,
    shipments: [
      {
        vendorId: 'v-lumen',
        items: [line('p1', 1)],
        subtotal: 289,
        shipping: 0,
        tax: 23.12,
        discount: 0,
        total: 312.12,
        status: 'Shipped',
      },
      {
        vendorId: 'v-terra',
        items: [line('p7', 1)],
        subtotal: 48,
        shipping: 6,
        tax: 3.84,
        discount: 0,
        total: 57.84,
        status: 'Delivered',
      },
    ],
  },
  {
    orderNumber: 'MSN-004796',
    email: 'priya@example.com',
    date: daysAgo(5),
    shippingInfo: address2,
    subtotal: 174,
    discount: 26.1,
    shipping: 6,
    tax: 11.83,
    grandTotal: 165.73,
    discountCode: 'WELCOME15',
    shipments: [
      {
        vendorId: 'v-loomstate',
        items: [line('p19', 1)],
        subtotal: 168,
        shipping: 0,
        tax: 11.42,
        discount: 25.2,
        total: 154.22,
        status: 'Delivered',
      },
      {
        vendorId: 'v-fieldnote',
        items: [line('p28', 1)],
        subtotal: 18,
        shipping: 6,
        tax: 1.22,
        discount: 2.7,
        total: 22.52,
        status: 'Processing',
      },
    ],
  },
  {
    orderNumber: 'MSN-004752',
    email: 'jordan@example.com',
    date: daysAgo(9),
    shippingInfo: address,
    subtotal: 143.5,
    discount: 0,
    shipping: 6,
    tax: 11.48,
    grandTotal: 160.98,
    shipments: [
      {
        vendorId: 'v-halden',
        items: [line('p17', 1)],
        subtotal: 175,
        shipping: 0,
        tax: 14,
        discount: 0,
        total: 189,
        status: 'Delivered',
      },
      {
        vendorId: 'v-still',
        items: [line('p31', 2)],
        subtotal: 76,
        shipping: 6,
        tax: 6.08,
        discount: 0,
        total: 88.08,
        status: 'Delivered',
      },
    ],
  },
]
