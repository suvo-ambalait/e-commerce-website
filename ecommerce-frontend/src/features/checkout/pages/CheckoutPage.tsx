import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { LuPackage, LuMapPin } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container, Section } from '@/shared/ui'
import { ArrowRightIcon, BagIcon } from '@/shared/ui/icons'
import type { Order, PaymentInfo, PaymentMethod, Shipment, ShippingInfo } from '@/shared/types'
import { addressesStore, zonesStore } from '@/features/marketplace/stores'
import { useCart } from '@/features/cart/context/CartContext'
import { useCartPricing } from '@/features/cart/lib/useCartPricing'
import { OrderSummary } from '@/features/cart/components/OrderSummary'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useInventory } from '@/features/inventory/context/InventoryContext'
import { CheckoutHeader, CheckoutSteps, type CheckoutStep } from '../components/CheckoutSteps'
import { ShipmentList } from '../components/ShipmentList'
import {
  CheckoutPanel,
  PaymentForm,
  ShippingForm,
  emptyPayment,
  emptyShipping,
  emptyWallet,
  type WalletInfo,
} from '../components/checkoutForms'

type Step = Exclude<CheckoutStep, 'cart'>

export function CheckoutPage() {
  useDocumentTitle('Checkout · AmbalaEshop')
  const navigate = useNavigate()
  const { items, groups, clearCart } = useCart()
  const { addOrder } = useOrders()
  const { applyOrderSale } = useInventory()
  const [allZones] = zonesStore.useStore()
  const [savedAddresses] = addressesStore.useStore()
  const zones = allZones.filter((z) => z.active)

  const defaultAddress = savedAddresses.find((a) => a.isDefault)
  const [step, setStep] = useState<Step>('details')
  const [shipping, setShipping] = useState<ShippingInfo>(() =>
    defaultAddress
      ? {
          fullName: defaultAddress.fullName,
          address: defaultAddress.address,
          city: defaultAddress.city,
          state: defaultAddress.area,
          zip: defaultAddress.zip,
          country: defaultAddress.country,
          phone: defaultAddress.phone,
        }
      : emptyShipping,
  )
  const [email, setEmail] = useState('')
  const [zoneId, setZoneId] = useState(() => zones[0]?.id ?? '')
  const [method, setMethod] = useState<PaymentMethod>('cod')
  const [payment, setPayment] = useState<PaymentInfo>(emptyPayment)
  const [wallet, setWallet] = useState<WalletInfo>(emptyWallet)

  const zone = zones.find((z) => z.id === zoneId) ?? zones[0]
  // a zone with no free-delivery amount never ships free
  const pricing = useCartPricing(
    zone ? { shippingFlatRate: zone.rate, freeShippingThreshold: zone.freeOver > 0 ? zone.freeOver : Number.POSITIVE_INFINITY } : undefined,
  )
  const codAvailable = zone?.codAvailable ?? true
  const effectiveMethod: PaymentMethod = method === 'cod' && !codAvailable ? 'bkash' : method

  const goTo = (s: CheckoutStep) => {
    if (s === 'cart') navigate('/cart')
    else setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (items.length === 0) {
    return (
      <Section size="sm" className="bg-surface-sunken/50">
        <Container>
          <div className="flex flex-col items-center rounded-3xl border border-border bg-surface px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <BagIcon className="h-7 w-7" />
            </span>
            <p className="mt-5 font-display text-xl font-bold text-ink">Your cart is empty</p>
            <p className="mt-2 text-sm text-ink-soft">Add something before checking out.</p>
            <Link
              to="/shop"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Browse the shop
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
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

    const order: Order = {
      orderNumber,
      email: email.trim().toLowerCase(),
      date: new Date().toISOString(),
      shippingInfo: shipping,
      zoneName: zone?.name,
      payment: {
        method: effectiveMethod,
        status: effectiveMethod === 'cod' ? 'Due on delivery' : 'Paid',
        reference:
          effectiveMethod === 'card'
            ? `•••• ${payment.cardNumber.replace(/\D/g, '').slice(-4)}`
            : effectiveMethod === 'cod'
              ? undefined
              : wallet.transactionId.trim(),
      },
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
    pricing.clear()
    navigate('/order-confirmation', { state: { orderNumber } })
  }

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        <CheckoutHeader
          title={
            step === 'details' ? (
              <>
                Your <em>details</em>
              </>
            ) : (
              <>
                Secure <em>payment</em>
              </>
            )
          }
          subtitle={
            step === 'details'
              ? 'Where should the makers send your parcels?'
              : 'Check your order, then pay once — we settle up with each shop.'
          }
          steps={<CheckoutSteps current={step} onStepClick={goTo} />}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'details' && (
                <ShippingForm
                  value={shipping}
                  onChange={setShipping}
                  email={email}
                  onEmailChange={setEmail}
                  zones={zones}
                  zoneId={zone?.id ?? ''}
                  onZoneChange={setZoneId}
                  savedAddresses={savedAddresses}
                  onSubmit={() => goTo('payment')}
                  onBack={() => goTo('cart')}
                />
              )}
              {step === 'payment' && (
                <PaymentForm
                  method={effectiveMethod}
                  onMethodChange={setMethod}
                  card={payment}
                  onCardChange={setPayment}
                  wallet={wallet}
                  onWalletChange={setWallet}
                  codAvailable={codAvailable}
                  total={pricing.totals.grandTotal}
                  onSubmit={placeOrder}
                  onBack={() => goTo('details')}
                  before={
                    <>
                      <CheckoutPanel
                        icon={<LuMapPin className="h-4 w-4" />}
                        title="Shipping to"
                        action={
                          <button
                            type="button"
                            onClick={() => goTo('details')}
                            className="rounded-full border border-border-strong px-3 py-1 text-caption font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                          >
                            Edit
                          </button>
                        }
                      >
                        <p className="text-sm text-ink">{shipping.fullName}</p>
                        <p className="mt-0.5 text-sm text-ink-soft">
                          {[shipping.address, shipping.state, shipping.city, shipping.zip, shipping.country].filter(Boolean).join(', ')}
                        </p>
                        <p className="mt-0.5 text-caption text-ink-mute">
                          {shipping.phone} · {email}
                          {zone && ` · ${zone.name}, ${zone.minDays}–${zone.maxDays} days`}
                        </p>
                      </CheckoutPanel>

                      <CheckoutPanel
                        icon={<LuPackage className="h-4 w-4" />}
                        title={`${groups.length} ${groups.length === 1 ? 'parcel' : 'parcels'}`}
                      >
                        <ShipmentList groups={groups} shipments={pricing.totals.shipments} />
                      </CheckoutPanel>
                    </>
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="lg:sticky lg:top-28">
            <OrderSummary pricing={pricing} showPromo={step === 'details'} />
          </div>
        </div>
      </Container>
    </Section>
  )
}
