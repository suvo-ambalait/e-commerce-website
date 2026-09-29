import type { ComponentType, ReactNode, SVGProps } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LuHeart,
  LuLayoutGrid,
  LuLogOut,
  LuMapPin,
  LuPackage,
  LuRotateCcw,
  LuShoppingBag,
  LuTruck,
  LuUserCog,
} from 'react-icons/lu'
import { returnsStore } from '@/features/marketplace/stores'
import { Avatar, Container, Section } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { useWishlist } from '../context/WishlistContext'
import { orderProgress, useCustomer } from '../lib/useCustomer'

interface NavItem {
  label: string
  to: string
  end?: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
  count?: number
}

/** Storefront shell for the customer's own pages: profile header + side nav + page. */
export function AccountLayout() {
  const { profile, orders } = useCustomer()
  const { count: savedCount } = useWishlist()
  const [returns] = returnsStore.useStore()
  const openReturns = returns.filter(
    (r) => r.email.toLowerCase() === profile.email.toLowerCase() && (r.status === 'Requested' || r.status === 'Approved'),
  ).length
  // newest order still in progress, for the header's "Track order" shortcut
  const activeOrder = orders.find((o) => ['Processing', 'On the way'].includes(orderProgress(o)))

  const nav: NavItem[] = [
    { label: 'Overview', to: '/account', end: true, icon: LuLayoutGrid },
    { label: 'Orders', to: '/account/orders', icon: LuPackage, count: orders.length },
    { label: 'Returns', to: '/account/returns', icon: LuRotateCcw, count: openReturns },
    { label: 'Saved items', to: '/wishlist', icon: LuHeart, count: savedCount },
    { label: 'Addresses', to: '/account/addresses', icon: LuMapPin },
    { label: 'Profile & settings', to: '/account/profile', icon: LuUserCog },
  ]

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        {/* profile header */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#5b21b6] via-[#6d28d9] to-[#8b5cf6] px-5 py-5 text-white shadow-sm sm:px-7 sm:py-6">
          {/* soft light + dot texture */}
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.12] mask-[linear-gradient(to_left,black,transparent)]"
            style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '16px 16px' }}
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar
                name={profile.name}
                size={56}
                className="bg-white! text-base! font-bold! text-[#5b21b6]! ring-4 ring-white/20"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">My account</p>
                <h1 className="truncate font-display! text-2xl font-extrabold! tracking-[-0.03em]! sm:text-[1.75rem]">
                  Hello, {profile.name.split(' ')[0]}
                </h1>
                <p className="truncate text-sm text-white/75">{profile.email}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {activeOrder && (
                <Link
                  to={`/account/orders/${activeOrder.orderNumber}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#5b21b6] shadow-sm transition-colors hover:bg-white/90"
                >
                  <LuTruck className="h-4 w-4" />
                  Track order
                </Link>
              )}
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full border border-white/30! bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                <LuShoppingBag className="h-4 w-4" />
                Continue shopping
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr] lg:items-start">
          {/* side nav — horizontal scroller on small screens */}
          <nav aria-label="Account" className="lg:sticky lg:top-28">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:p-2 lg:shadow-sm">
              {nav.map((item) => (
                <li key={item.to} className="shrink-0">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent-soft text-accent'
                          : 'border border-border bg-surface text-ink-soft hover:text-ink lg:border-0 lg:bg-transparent lg:hover:bg-surface-sunken',
                      )
                    }
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.count && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-sunken px-1.5 text-[11px] font-semibold tabular-nums text-ink-soft">
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
              <li className="shrink-0 lg:mt-1 lg:border-t lg:border-border lg:pt-1">
                <NavLink
                  to="/logout"
                  className="flex items-center gap-3 whitespace-nowrap rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-danger lg:border-0 lg:bg-transparent lg:hover:bg-danger-soft"
                >
                  <LuLogOut className="h-4.5 w-4.5 shrink-0" />
                  Sign out
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </Container>
    </Section>
  )
}

/** Card used by every account page. */
export function AccountCard({
  title,
  subtitle,
  aside,
  children,
  className,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6', className)}>
      {(title || aside) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-display! text-lg font-bold! tracking-[-0.01em]! text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-caption text-ink-mute">{subtitle}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}
