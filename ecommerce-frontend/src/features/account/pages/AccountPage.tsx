import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import {
  Button,
  ButtonLink,
  Card,
  CardBody,
  Container,
  EmptyState,
  Field,
  Input,
  Section,
} from '@/shared/ui'
import { formatDateLong, formatPrice } from '@/shared/lib/format'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'

export function AccountPage() {
  useDocumentTitle('Account · MorerDokan')
  const { user, updateProfile, logout } = useAuth()

  if (!user) {
    return (
      <Section>
        <Container size="narrow" className="text-center">
          <h1 className="text-2xl text-ink">Sign in to see your account</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Your orders, saved addresses and profile live here.
          </p>
          <ButtonLink to="/login" className="mt-5">
            Sign in
          </ButtonLink>
        </Container>
      </Section>
    )
  }

  return <Dashboard email={user.email} name={user.name} onSave={updateProfile} onLogout={logout} />
}

function Dashboard({
  email,
  name,
  onSave,
  onLogout,
}: {
  email: string
  name: string
  onSave: (name: string) => void
  onLogout: () => void
}) {
  const { ordersFor } = useOrders()
  const { getVendor } = useVendors()
  const orders = ordersFor(email)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(name)

  const addresses = orders
    .map((o) => o.shippingInfo)
    .filter((addr, i, arr) => arr.findIndex((a) => a.address === addr.address && a.zip === addr.zip) === i)

  return (
    <Section size="sm">
      <Container>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl text-ink">Account</h1>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div className="space-y-6">
            <Card>
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wide text-ink-soft">Profile</h2>
                {editing ? (
                  <div className="mt-3 space-y-3">
                    <Field label="Name">
                      {(id) => <Input id={id} value={nameInput} onChange={(e) => setNameInput(e.target.value)} />}
                    </Field>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          onSave(nameInput.trim() || name)
                          setEditing(false)
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm text-ink">{name}</p>
                    <p className="text-sm text-ink-mute">{email}</p>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="mt-2 text-caption text-accent hover:underline"
                    >
                      Edit name
                    </button>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wide text-ink-soft">Saved addresses</h2>
                {addresses.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-mute">Addresses used at checkout show up here.</p>
                ) : (
                  <ul className="mt-3 space-y-3 text-sm text-ink-soft">
                    {addresses.map((a, i) => (
                      <li key={i} className="leading-relaxed">
                        {a.fullName}
                        <br />
                        {a.address}
                        <br />
                        {a.city}, {a.state} {a.zip}
                        <br />
                        {a.country}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink-soft">Order history</h2>
            {orders.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="No orders yet"
                description="When you place an order, its per-maker parcels appear here with live status."
                action={<ButtonLink to="/shop">Start shopping</ButtonLink>}
              />
            ) : (
              <div className="mt-4 space-y-4">
                {orders.map((order) => (
                  <Card key={order.orderNumber}>
                    <CardBody>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-ink">{order.orderNumber}</p>
                          <p className="text-caption text-ink-mute">{formatDateLong(order.date)}</p>
                        </div>
                        <p className="font-serif text-lg text-ink">{formatPrice(order.grandTotal)}</p>
                      </div>

                      <div className="mt-4 space-y-3">
                        {order.shipments.map((shipment) => {
                          const vendor = getVendor(shipment.vendorId)
                          return (
                            <div
                              key={shipment.vendorId}
                              className="flex items-center justify-between gap-3 border-t border-border pt-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex -space-x-2">
                                  {shipment.items.slice(0, 3).map((item) => (
                                    <img
                                      key={item.key}
                                      src={item.image}
                                      alt=""
                                      className="h-10 w-10 rounded-sm border-2 border-surface object-cover"
                                    />
                                  ))}
                                </div>
                                <Link
                                  to={vendor ? `/vendor/${vendor.slug}` : '#'}
                                  className="truncate text-sm text-ink-soft hover:underline"
                                >
                                  {vendor?.name ?? 'MorerDokan'}
                                </Link>
                              </div>
                              <OrderStatusBadge status={shipment.status} />
                            </div>
                          )
                        })}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
