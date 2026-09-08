import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, ButtonLink, Container, Section } from '@/shared/ui'
import type { Order, PaymentInfo, Shipment, ShippingInfo } from '@/shared/types'
import { useCart } from '@/features/cart/context/CartContext'
import { useCartPricing } from '@/features/cart/lib/useCartPricing'
import { OrderSummary } from '@/features/cart/components/OrderSummary'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { CheckoutSteps, type CheckoutStep } from '../components/CheckoutSteps'
import { ShipmentList } from '../components/ShipmentList'
import { PaymentForm, ShippingForm, emptyPayment, emptyShipping } from '../components/checkoutForms'

export function CheckoutPage() {
  useDocumentTitle('Checkout · MorerDokan')
  const navigate = useNavigate()
  const { items, groups, clearCart } = useCart()
  const pricing = useCartPricing()
  const { user, signup } = useAuth()
  const { addOrder } = useOrders()
  const { applyOrderSale } = useInventory()

  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [shipping, setShipping] = useState<ShippingInfo>(emptyShipping)
  const [payment, setPayment] = useState<PaymentInfo>(emptyPayment)

  if (items.length === 0) {
    return (
      <Section>
        <Container size="narrow" className="text-center">
          <h1 className="text-2xl text-ink">Your cart is empty</h1>
          <p className="mt-2 text-sm text-ink-soft">Add something before checking out.</p>
          <ButtonLink to="/shop" className="mt-5">
            Browse the shop
          </ButtonLink>
        </Container>
      </Section>
    )
  }

  const placeOrder = () => {
    const orderNumber = `MSN-${Date.now().toString().slice(-6)}`
    const { totals } = pricing

    const shipments: Shipment[] = groups.map((group, i) => {
      const t = totals.shipments[i]
      return {
        vendorId: group.vendorId,
        items: group.items,
        subtotal: t.subtotal,
        shipping: t.shipping,
        tax: t.tax,
        discount: t.discount,
        total: t.total,
        status: 'Processing',
      }
    })

    const email = (user?.email ?? shipping.fullName.split(' ')[0] + '@guest.example').toLowerCase()
    if (!user) signup(shipping.fullName || 'Guest', email, 'demo')

    const order: Order = {
      orderNumber,
      email,
      date: new Date().toISOString(),
      shippingInfo: shipping,
      discountCode: pricing.appliedCode ?? undefined,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      tax: totals.tax,
      grandTotal: totals.grandTotal,
      shipments,
    }

    addOrder(order)
    applyOrderSale(order)
    clearCart()
    navigate('/order-confirmation', { state: { orderNumber } })
  }

  return (
    <Section size="sm">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl text-ink">Checkout</h1>
          <Link to="/cart" className="text-caption text-accent underline-offset-4 hover:underline">
            Edit cart
          </Link>
        </div>
        <div className="mt-6">
          <CheckoutSteps current={step} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {step === 'shipping' && (
                  <ShippingForm value={shipping} onChange={setShipping} onSubmit={() => setStep('payment')} />
                )}
                {step === 'payment' && (
                  <PaymentForm
                    value={payment}
                    onChange={setPayment}
                    onSubmit={() => setStep('review')}
                    onBack={() => setStep('shipping')}
                  />
                )}
                {step === 'review' && (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-border bg-surface p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-ink">Shipping to</p>
                        <button
                          type="button"
                          onClick={() => setStep('shipping')}
                          className="text-caption text-accent hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="mt-1 text-ink-soft">
                        {shipping.fullName}, {shipping.address}, {shipping.city} {shipping.zip}, {shipping.country}
                      </p>
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-medium text-ink">
                        {groups.length} {groups.length === 1 ? 'parcel' : 'parcels'}
                      </p>
                      <ShipmentList groups={groups} shipments={pricing.totals.shipments} />
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="ghost" onClick={() => setStep('payment')}>
                        Back
                      </Button>
                      <Button type="button" size="lg" onClick={placeOrder}>
                        Place order · {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pricing.totals.grandTotal)}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:sticky lg:top-28">
            <OrderSummary pricing={pricing} showPromo={step !== 'review'} />
          </div>
        </div>
      </Container>
    </Section>
  )
}
