import { useCallback, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useCart } from '@/features/cart/context/CartContext'
import { useWishlist } from '@/features/account/context/WishlistContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { AccountMenu } from '@/features/auth/components/AccountMenu'
import { ThemeToggle } from '@/features/account/components/ThemeToggle'
import { SearchDialog, useSearchHotkey } from '@/features/catalog/components/SearchDialog'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { formatPriceWhole } from '@/shared/lib/format'
import { MobileNav } from './MobileNav'
import { MegaMenu } from './MegaMenu'
import { BrandLockup } from './Logo'
import { primaryNav } from './nav'
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, StoreIcon } from '@/shared/ui/icons'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { totalItems } = useCart()
  const { count: wishCount } = useWishlist()
  const { categories } = useCatalog()
  const { settings } = useSettings()

  const openSearch = useCallback(() => setSearchOpen(true), [])
  useSearchHotkey(openSearch)

  return (
    <>
      {/* announcement bar — fixed dark colours in both themes */}
      <div className="bg-[#0b0a10] text-white">
        <div className="container-page grid h-9 grid-cols-1 items-center text-[11px] md:grid-cols-[1fr_auto_1fr]">
          <span className="hidden items-center gap-1.5 text-[#b8b3c7] md:flex">
            <StoreIcon className="h-3.5 w-3.5" aria-hidden />
            Ships from the studio
          </span>
          <p className="truncate text-center font-semibold uppercase tracking-[0.14em]">
            Free shipping over {formatPriceWhole(settings.freeShippingThreshold)}
            <span className="hidden text-[#a78bfa] sm:inline"> · Independent makers, one checkout</span>
          </p>
          <span className="hidden items-center justify-end gap-5 text-[#b8b3c7] md:flex">
            <Link to="/account" className="transition-colors hover:text-white">
              Track an order
            </Link>
            <Link to="/about" className="transition-colors hover:text-white">
              Help
            </Link>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-3 md:h-18 lg:gap-5">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:text-ink lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link to="/" className="shrink-0" aria-label={`${settings.storeName} home`}>
            <BrandLockup className="text-[1.1rem] sm:text-[1.25rem]" nameClassName="text-ink max-[379px]:hidden" />
          </Link>

          {/* nav pill */}
          <nav className="hidden items-center gap-0.5 rounded-full bg-surface-sunken p-1 lg:flex">
            <MegaMenu categories={categories} />
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
                    item.highlight && 'text-accent hover:text-accent',
                  )
                }
              >
                {item.label}
                {item.highlight && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            {/* search: pill on wide screens, icon on small */}
            <button
              type="button"
              onClick={openSearch}
              className="mr-1 hidden h-10 w-52 items-center gap-2.5 rounded-full border border-border-strong bg-surface px-4 text-sm text-ink-mute transition-colors hover:border-accent md:flex xl:w-64"
            >
              <SearchIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">Search products or makers</span>
            </button>
            <button
              type="button"
              aria-label="Search"
              onClick={openSearch}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:text-ink md:hidden"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            {/* wrapper hides it: IconButton's own inline-flex would override a `hidden` class */}
            <span className="hidden sm:inline-flex">
              <ThemeToggle />
            </span>
            <Link
              to="/wishlist"
              aria-label={`Wishlist, ${wishCount} items`}
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:text-ink sm:inline-flex"
            >
              <HeartIcon className="h-5 w-5" />
              {wishCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold text-on-accent">
                  {wishCount}
                </span>
              )}
            </Link>
            <AccountMenu />

            <button
              type="button"
              aria-label={`Cart, ${totalItems} items`}
              onClick={() => setCartOpen(true)}
              className="group ml-1 inline-flex h-10 items-center gap-2 rounded-full bg-ink pl-3.5 pr-1.5 text-sm font-semibold text-bg transition-colors hover:bg-accent hover:text-on-accent"
            >
              <BagIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-on-accent tabular-nums transition-colors group-hover:bg-white/20">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onSearch={() => {
          setMobileOpen(false)
          setSearchOpen(true)
        }}
        categories={categories}
      />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
