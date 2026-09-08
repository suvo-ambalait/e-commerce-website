import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Drawer } from '@/shared/ui'
import { ThemeToggle } from '@/features/account/components/ThemeToggle'
import { useAuth } from '@/features/auth/context/AuthContext'
import type { Category } from '@/shared/types'
import { primaryNav } from './nav'
import { ChevronRightIcon, SearchIcon } from '@/shared/ui/icons'

export function MobileNav({
  open,
  onClose,
  onSearch,
  categories,
}: {
  open: boolean
  onClose: () => void
  onSearch: () => void
  categories: Category[]
}) {
  const { user, logout, isVendor, isAdmin } = useAuth()

  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu" widthClass="w-full max-w-xs">
      <nav className="flex flex-col px-2 py-3">
        <button
          type="button"
          onClick={onSearch}
          className="mb-1 flex items-center gap-3 rounded-sm border border-border-strong px-4 py-2.5 text-sm text-ink-mute transition-colors hover:border-ink hover:text-ink"
        >
          <SearchIcon className="h-4 w-4" />
          Search…
        </button>

        {primaryNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                rowClass,
                isActive && 'bg-surface-sunken font-medium text-ink before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent',
              )
            }
          >
            {item.label}
            <ChevronRightIcon className="h-4 w-4 text-ink-mute" />
          </NavLink>
        ))}

        <p className="px-4 pb-2 pt-5 text-caption font-medium uppercase tracking-wide text-ink-mute">
          Categories
        </p>
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/shop?category=${encodeURIComponent(category.name)}`}
            onClick={onClose}
            className={rowClass}
          >
            {category.name}
            <ChevronRightIcon className="h-4 w-4 text-ink-mute" />
          </Link>
        ))}

        <div className="mt-5 border-t border-border px-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-soft">Theme</span>
            <ThemeToggle />
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <Link to="/wishlist" onClick={onClose} className="py-2 text-sm text-ink-soft">
              Saved items
            </Link>
            {user ? (
              <>
                <Link to="/account" onClick={onClose} className="py-2 text-sm text-ink-soft">
                  Orders &amp; profile
                </Link>
                {isVendor && (
                  <Link to="/vendor/dashboard" onClick={onClose} className="py-2 text-sm text-ink-soft">
                    Vendor dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" onClick={onClose} className="py-2 text-sm text-ink-soft">
                    Platform admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    onClose()
                  }}
                  className="py-2 text-left text-sm text-ink-soft"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={onClose} className="py-2 text-sm text-ink-soft">
                  Sign in
                </Link>
                <Link to="/vendor/signup" onClick={onClose} className="py-2 text-sm text-accent">
                  Sell on MorerDokan
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </Drawer>
  )
}

const rowClass =
  'relative flex items-center justify-between rounded-sm px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-sunken'
