import { Link } from 'react-router-dom'
import { LuArrowRight, LuChevronRight, LuHeart, LuMapPin, LuPackage, LuPhone, LuMail, LuWallet } from 'react-icons/lu'
import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ButtonLink, EmptyState, Money } from '@/shared/ui'
import { useWishlist } from '../context/WishlistContext'
import { AccountCard } from '../components/AccountLayout'
import { OrderCard } from '../components/OrderCard'
import { formatAddress, orderProgress, useCustomer } from '../lib/useCustomer'

/** Account overview: quick stats, recent orders, and contact details. */
export function AccountPage() {
  useDocumentTitle('Account · AmbalaEshop')
  const { profile, orders, address, spent } = useCustomer()
  const { count: savedCount } = useWishlist()

  const active = orders.filter((o) => ['Processing', 'On the way'].includes(orderProgress(o))).length

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<LuPackage className="h-5 w-5" />}
          label="Orders"
          value={orders.length}
          hint={active ? `${active} in progress` : 'None in progress'}
          to="/account/orders"
        />
        <Stat
          icon={<LuWallet className="h-5 w-5" />}
          label="Total spent"
          value={<Money value={spent} />}
          hint="Across every shop"
          to="/account/orders"
        />
        <Stat
          icon={<LuHeart className="h-5 w-5" />}
          label="Saved items"
          value={savedCount}
          hint={savedCount ? 'In your wishlist' : 'Nothing saved yet'}
          to="/wishlist"
        />
      </div>

      <AccountCard
        title="Recent orders"
        aside={
          orders.length > 0 && (
            <Link to="/account/orders" className="inline-flex items-center gap-1 text-caption font-semibold text-accent hover:underline">
              View all
              <LuArrowRight className="h-3.5 w-3.5" />
            </Link>
          )
        }
      >
        {orders.length === 0 ? (
          <EmptyState
            icon={<LuPackage />}
            title="No orders yet"
            description="When you buy something, you can follow it here."
            action={<ButtonLink to="/shop">Start shopping</ButtonLink>}
          />
        ) : (
          <div className="-my-1 divide-y divide-border">
            {orders.slice(0, 3).map((o) => (
              <OrderCard key={o.orderNumber} order={o} flat />
            ))}
          </div>
        )}
      </AccountCard>

      <div className="grid gap-5 md:grid-cols-2">
        <AccountCard
          title="Contact details"
          aside={
            <Link to="/account/profile" className="text-caption font-semibold text-accent hover:underline">
              Edit
            </Link>
          }
        >
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <Detail icon={<LuMail className="h-4 w-4" />}>{profile.email}</Detail>
            <Detail icon={<LuPhone className="h-4 w-4" />}>{profile.phone || 'No phone added'}</Detail>
          </ul>
        </AccountCard>

        <AccountCard
          title="Delivery address"
          aside={
            <Link to="/account/addresses" className="text-caption font-semibold text-accent hover:underline">
              Manage
            </Link>
          }
        >
          {address ? (
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <Detail icon={<LuMapPin className="h-4 w-4" />}>
                <span className="block font-semibold text-ink">{address.fullName}</span>
                {formatAddress(address)}
              </Detail>
            </ul>
          ) : (
            <p className="text-sm text-ink-mute">Your address is saved when you place your first order.</p>
          )}
        </AccountCard>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, hint, to }: { icon: ReactNode; label: string; value: ReactNode; hint: string; to: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-accent/40! hover:shadow-md sm:p-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-medium text-ink-mute">{label}</p>
        <p className="truncate font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] text-ink tabular-nums">
          {value}
        </p>
        <p className="truncate text-caption text-ink-mute">{hint}</p>
      </div>
      <LuChevronRight className="h-4 w-4 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
    </Link>
  )
}

function Detail({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-accent">{icon}</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </li>
  )
}
