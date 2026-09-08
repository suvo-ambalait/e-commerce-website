import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar, Menu, MenuButton, MenuLink } from '@/shared/ui'
import { UserIcon } from '@/shared/ui/icons'

export function AccountMenu() {
  const { user, logout, isAdmin, isVendor } = useAuth()

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label="Sign in"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink"
      >
        <UserIcon className="h-5 w-5" />
      </Link>
    )
  }

  return (
    <Menu
      trigger={({ toggle }) => (
        <button type="button" onClick={toggle} aria-label="Account menu" className="rounded-full">
          <Avatar name={user.name} size={34} />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="border-b border-border px-3 pb-2 pt-1">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-caption text-ink-mute">{user.email}</p>
          </div>
          <div className="pt-1">
            <MenuLink to="/account" onClick={close}>
              Orders & profile
            </MenuLink>
            <MenuLink to="/wishlist" onClick={close}>
              Saved items
            </MenuLink>
            {isVendor && (
              <MenuLink to="/vendor/dashboard" onClick={close}>
                Vendor dashboard
              </MenuLink>
            )}
            {isAdmin && (
              <MenuLink to="/admin" onClick={close}>
                Platform admin
              </MenuLink>
            )}
            {!isVendor && !isAdmin && (
              <MenuLink to="/vendor/signup" onClick={close}>
                Sell on MorerDokan
              </MenuLink>
            )}
            <MenuButton
              onClick={() => {
                logout()
                close()
              }}
            >
              Sign out
            </MenuButton>
          </div>
        </>
      )}
    </Menu>
  )
}
