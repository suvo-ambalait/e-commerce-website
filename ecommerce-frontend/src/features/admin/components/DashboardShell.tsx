import { useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { ScrollToTop } from '@/shared/layout/ScrollToTop'
import { Logo } from '@/shared/layout/Logo'
import { Avatar, Drawer, Menu, MenuButton, MenuLink } from '@/shared/ui'
import { ChevronRightIcon, MenuIcon, StoreIcon, LogOutIcon } from '@/shared/ui/icons'
import { useAuth } from '@/features/auth/context/AuthContext'
import { NotificationsMenu } from './NotificationsMenu'

export interface NavItem {
  label: string
  to: string
  end?: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export interface NavGroup {
  /** undefined = ungrouped items pinned to the top, never collapsible */
  title?: string
  items: NavItem[]
}

export function DashboardShell({
  storageKey,
  subtitle,
  groups,
  accent,
  basePath,
}: {
  storageKey: string
  subtitle: string
  groups: NavGroup[]
  accent?: ReactNode
  basePath: string
}) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = usePersistedState(`${storageKey}:rail`, false)
  const [closedGroups, setClosedGroups] = usePersistedState<string[]>(`${storageKey}:groups`, [])

  const allItems = groups.flatMap((g) => g.items)
  const current =
    allItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ??
    subtitle

  const toggleGroup = (title: string) =>
    setClosedGroups((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]))

  const NavTree = ({ rail }: { rail: boolean }) => (
    <div className="space-y-4">
      {groups.map((group, gi) => {
        const closed = group.title ? closedGroups.includes(group.title) : false
        return (
          <div key={group.title ?? `g${gi}`}>
            {group.title && !rail && (
              <button
                type="button"
                onClick={() => toggleGroup(group.title!)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-mute transition-colors hover:text-ink-soft"
              >
                {group.title}
                <ChevronRightIcon className={cn('h-3.5 w-3.5 transition-transform', !closed && 'rotate-90')} />
              </button>
            )}
            {group.title && rail && gi > 0 && <div className="mx-3 my-2 border-t border-border" />}
            <AnimatePresence initial={false}>
              {(!closed || rail) && (
                <motion.div
                  initial={group.title && !rail ? { height: 0, opacity: 0 } : false}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeEditorial }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        title={rail ? item.label : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                            rail && 'justify-center px-0',
                            isActive
                              ? 'bg-ink text-bg'
                              : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                          )
                        }
                      >
                        <item.icon className="h-4.5 w-4.5 shrink-0" />
                        {!rail && item.label}
                      </NavLink>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-bg">
      <ScrollToTop />

      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className={cn('flex flex-col gap-1 px-4 py-5', collapsed && 'items-center px-0')}>
          <Link to="/" className="inline-flex text-ink" aria-label="Storefront home">
            <Logo className="text-[1.05rem]" markOnly={collapsed} />
          </Link>
          {!collapsed && (
            <span className="pl-7 text-[0.625rem] uppercase tracking-[0.12em] text-ink-mute">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavTree rail={collapsed} />
        </div>

        <div className="border-t border-border p-3">
          {!collapsed && accent}
          <div className={cn('space-y-0.5', collapsed && 'flex flex-col items-center')}>
            <Link
              to="/"
              title="Back to store"
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-surface-sunken hover:text-ink',
                collapsed && 'justify-center px-0',
              )}
            >
              <StoreIcon className="h-4.5 w-4.5" />
              {!collapsed && 'Back to store'}
            </Link>
            <button
              type="button"
              onClick={logout}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-ink-soft hover:bg-surface-sunken hover:text-ink',
                collapsed && 'justify-center px-0',
              )}
            >
              <LogOutIcon className="h-4.5 w-4.5" />
              {!collapsed && 'Sign out'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-mute hover:bg-surface-sunken hover:text-ink',
              collapsed && 'justify-center px-0',
            )}
          >
            <ChevronRightIcon className={cn('h-4.5 w-4.5 transition-transform', !collapsed && 'rotate-180')} />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:text-ink lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[0.625rem] uppercase tracking-[0.12em] text-ink-mute">{subtitle}</p>
              <h1 className="font-serif text-lg text-ink">{current}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationsMenu />
            <Menu
              trigger={({ toggle }) => (
                <button type="button" onClick={toggle} aria-label="Account menu" className="ml-1 flex items-center gap-2 rounded-full">
                  <Avatar name={user?.name ?? '?'} size={30} />
                  <ChevronRightIcon className="hidden h-3.5 w-3.5 rotate-90 text-ink-mute sm:block" />
                </button>
              )}
            >
              {(close) => (
                <>
                  <div className="border-b border-border px-3 pb-2 pt-1">
                    <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
                    <p className="truncate text-caption text-ink-mute">{user?.email}</p>
                  </div>
                  <div className="pt-1">
                    <MenuLink to={`${basePath}/account`} onClick={close}>
                      Your profile
                    </MenuLink>
                    {isAdmin ? (
                      <MenuLink to="/admin/settings" onClick={close}>
                        Store settings
                      </MenuLink>
                    ) : (
                      <MenuLink to="/vendor/dashboard/profile" onClick={close}>
                        Storefront settings
                      </MenuLink>
                    )}
                    <MenuLink to="/" onClick={close}>
                      Switch to storefront
                    </MenuLink>
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
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: easeEditorial }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} side="left" title={subtitle} widthClass="w-full max-w-xs">
        <div className="p-3">
          <NavTree rail={false} />
        </div>
      </Drawer>
    </div>
  )
}

