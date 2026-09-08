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
import { MobileNav } from './MobileNav'
import { MegaMenu } from './MegaMenu'
import { Logo } from './Logo'
import { primaryNav } from './nav'
import { BagIcon, HeartIcon, MenuIcon, SearchIcon } from '@/shared/ui/icons'

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
      <div className="bg-ink text-bg">
        <p className="container-page py-1.5 text-center text-[0.7rem] uppercase tracking-[0.16em]">
          Free shipping over ${settings.freeShippingThreshold} · Independent makers, one checkout
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="container-page flex h-14 items-center gap-4 md:h-16">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:text-ink lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link to="/" className="mr-2" aria-label={`${settings.storeName} home`}>
            <Logo className="text-[1.1rem]" />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <MegaMenu categories={categories} />
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'relative py-1 text-sm transition-colors hover:text-ink',
                    'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-accent after:transition-transform after:duration-200 after:ease-[var(--ease-editorial)]',
                    'hover:after:scale-x-100',
                    isActive ? 'text-ink after:scale-x-100' : 'text-ink-soft after:scale-x-0',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              aria-label="Search"
              onClick={openSearch}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:text-ink"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            <ThemeToggle className="hidden sm:inline-flex" />
            <Link
              to="/wishlist"
              aria-label={`Wishlist, ${wishCount} items`}
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:text-ink sm:inline-flex"
            >
              <HeartIcon className="h-5 w-5" />
              {wishCount > 0 && <Dot>{wishCount}</Dot>}
            </Link>
            <AccountMenu />
            <button
              type="button"
              aria-label={`Cart, ${totalItems} items`}
              onClick={() => setCartOpen(true)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:text-ink"
            >
              <BagIcon className="h-5 w-5" />
              {totalItems > 0 && <Dot>{totalItems}</Dot>}
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

function Dot({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-medium text-on-accent">
      {children}
    </span>
  )
}
