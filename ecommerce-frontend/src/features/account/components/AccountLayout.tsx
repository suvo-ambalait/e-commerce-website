import type { ComponentType, ReactNode, SVGProps } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LuHeart, LuLayoutGrid, LuLogOut, LuMapPin, LuPackage, LuRotateCcw, LuUserCog } from 'react-icons/lu'
import { returnsStore } from '@/features/marketplace/stores'
import { Avatar, Container, Section } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { useWishlist } from '../context/WishlistContext'
import { useCustomer } from '../lib/useCustomer'

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
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#6d28d9] to-[#a78bfa] px-5 py-6 text-white sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/20!" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full border border-white/10!" />
          <div className="relative flex items-center gap-4">
            <Avatar name={profile.name} size={60} className="ring-4 ring-white/30" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">My account</p>
              <h1 className="truncate font-display! text-2xl font-extrabold! tracking-[-0.03em]! sm:text-3xl">
                Hello, {profile.name.split(' ')[0]}
              </h1>
              <p className="truncate text-sm text-white/80">{profile.email}</p>
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
