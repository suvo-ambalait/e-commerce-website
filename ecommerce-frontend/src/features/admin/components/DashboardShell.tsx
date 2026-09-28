import { useEffect, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LuPanelLeftClose, LuPanelLeftOpen, LuChevronsUpDown, LuCornerDownLeft } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { ScrollToTop } from '@/shared/layout/ScrollToTop'
import { BrandLockup, Logo } from '@/shared/layout/Logo'
import { Drawer, Menu, MenuLink } from '@/shared/ui'
import { ChevronRightIcon, MenuIcon, SearchIcon } from '@/shared/ui/icons'

export interface NavItem {
  label: string
  to: string
  end?: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** small count pill beside the label (dot in the collapsed rail) */
  badge?: { count: number; tone?: 'accent' | 'warning' }
}

export interface NavGroup {
  /** undefined = ungrouped items pinned to the top */
  title?: string
  items: NavItem[]
}

/** One entry in the account menu that opens from the user row at the bottom of the sidebar. */
export interface AccountLink {
  label: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone?: 'danger'
}

const badgeTone = {
  accent: 'bg-accent-soft text-accent',
  warning: 'bg-warning-soft text-warning',
}
const dotTone = { accent: 'bg-accent', warning: 'bg-warning' }

/**
 * Hover/focus tooltip for the collapsed rail. Rendered in a portal with fixed
 * positioning because the rail's scroll area clips anything that overflows it.
 * When `enabled` is false it renders the children untouched.
 */
function RailTip({
  label,
  hint,
  badge,
  enabled,
  children,
}: {
  label: string
  /** secondary text, e.g. a keyboard shortcut */
  hint?: string
  badge?: NavItem['badge']
  enabled: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // hide if anything scrolls or the window resizes while it's open
  useEffect(() => {
    if (!pos) return
    const hide = () => setPos(null)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [pos])

  if (!enabled) return <>{children}</>

  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (r) setPos({ top: r.top + r.height / 2, left: r.right + 14 })
  }
  const hide = () => setPos(null)

  return (
    <div
      ref={ref}
      className="flex justify-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onMouseDown={hide}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {pos && (
            <motion.div
              role="tooltip"
              initial={{ opacity: 0, x: -6, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: easeEditorial }}
              style={{ top: pos.top, left: pos.left }}
              className="pointer-events-none fixed z-100 -translate-y-1/2"
            >
              <div className="relative flex items-center gap-2 whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-caption font-semibold text-bg shadow-[0_12px_28px_rgba(11,10,16,0.28)]">
                {/* arrow pointing back at the icon */}
                <span aria-hidden className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-xs bg-ink" />
                <span className="relative">{label}</span>
                {badge && badge.count > 0 && (
                  <span
                    className={cn(
                      'relative flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                      badge.tone === 'warning' ? 'bg-warning text-white' : 'bg-accent text-on-accent',
                    )}
                  >
                    {badge.count}
                  </span>
                )}
                {hint && (
                  <kbd className="relative rounded-md bg-bg/15 px-1.5 py-px font-sans text-[10px] font-semibold text-bg/80">
                    {hint}
                  </kbd>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

export function DashboardShell({
  storageKey,
  subtitle,
  groups,
  accent,
  user,
  accountLinks,
  topBarActions,
}: {
  storageKey: string
  subtitle: string
  groups: NavGroup[]
  /** card shown above the user row in the expanded sidebar */
  accent?: ReactNode
  user: { name: string; role: string }
  /** account menu entries — each dashboard passes its own so admins and vendors only see their links */
  accountLinks: AccountLink[]
  /** extra buttons in the top bar, e.g. the admin notifications bell */
  topBarActions?: ReactNode
}) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [collapsed, setCollapsed] = usePersistedState(`${storageKey}:rail`, false)

  const allItems = groups.flatMap((g) => g.items)
  const current =
    allItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ??
    subtitle

  // Ctrl/Cmd+K → jump to a section
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setJumpOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const NavTree = ({ rail }: { rail: boolean }) => (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={group.title ?? `g${gi}`}>
          {group.title && !rail && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{group.title}</p>
          )}
          {group.title && rail && gi > 0 && <div className="mx-auto mb-3 w-6 border-t border-border" />}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <RailTip key={item.to} enabled={rail} label={item.label} badge={item.badge}>
              <NavLink
                to={item.to}
                end={item.end}
                aria-label={rail ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors',
                    rail ? 'mx-auto h-10 w-10 justify-center' : 'px-3 py-2',
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                  )
                }
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {!rail && <span className="flex-1">{item.label}</span>}
                {item.badge && item.badge.count > 0 &&
                  (rail ? (
                    <span
                      className={cn(
                        'absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-surface',
                        dotTone[item.badge.tone ?? 'accent'],
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                        badgeTone[item.badge.tone ?? 'accent'],
                      )}
                    >
                      {item.badge.count}
                    </span>
                  ))}
              </NavLink>
              </RailTip>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const UserRow = ({ rail }: { rail: boolean }) => (
    <Menu
      side="top"
      align="left"
      trigger={({ toggle }) => (
        <RailTip enabled={rail} label={user.name} hint={user.role}>
        <button
          type="button"
          onClick={toggle}
          aria-label="Account menu"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl text-left transition-colors hover:bg-surface-sunken',
            rail ? 'justify-center p-1' : 'p-2',
          )}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-bg">
            {user.name[0]}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-surface" />
          </span>
          {!rail && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
                <span className="block truncate text-caption text-ink-mute">{user.role}</span>
              </span>
              <LuChevronsUpDown className="h-4 w-4 shrink-0 text-ink-mute" />
            </>
          )}
        </button>
        </RailTip>
      )}
    >
      {(close) => (
        <div>
          {accountLinks.map((link) => (
            <MenuLink key={link.to} to={link.to} onClick={close} tone={link.tone}>
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </div>
            </MenuLink>
          ))}
        </div>
      )}
    </Menu>
  )

  return (
    <div className="dash-shell flex min-h-screen bg-surface-sunken/60">
      <ScrollToTop />

      {/* desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 p-3 transition-[width] duration-200 lg:block',
          collapsed ? 'w-[5.25rem]' : 'w-68',
        )}
      >
        <div className="flex h-full flex-col rounded-3xl border border-border bg-surface shadow-sm">
          {/* brand */}
          <div className={cn('flex items-center gap-2 p-4', collapsed && 'flex-col px-0')}>
            <RailTip enabled={collapsed} label="Storefront home">
            <Link to="/" className="min-w-0 flex-1" aria-label="Storefront home">
              {collapsed ? (
                <Logo boxed className="h-10 w-10" />
              ) : (
                <span className="block">
                  <BrandLockup className="text-[1.05rem]" />
                  <span className="mt-1 block text-caption text-ink-mute">{subtitle}</span>
                </span>
              )}
            </Link>
            </RailTip>
            <RailTip enabled={collapsed} label="Expand sidebar">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-ink-mute transition-colors hover:border-accent/50! hover:text-accent"
            >
              {collapsed ? <LuPanelLeftOpen className="h-4 w-4" /> : <LuPanelLeftClose className="h-4 w-4" />}
            </button>
            </RailTip>
          </div>

          {/* jump to */}
          <div className={cn('px-3 pb-3', collapsed && 'flex justify-center px-0')}>
            <RailTip enabled={collapsed} label="Jump to…" hint="Ctrl K">
            <button
              type="button"
              onClick={() => setJumpOpen(true)}
              aria-label="Jump to a section"
              className={cn(
                'flex items-center gap-2 rounded-xl border border-border bg-surface-sunken/60 text-sm text-ink-mute transition-colors hover:border-accent/50!',
                collapsed ? 'h-10 w-10 justify-center' : 'h-10 w-full px-3',
              )}
            >
              <SearchIcon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Jump to…</span>
                  <kbd className="rounded-md border border-border bg-surface px-1.5 font-sans text-[10px] font-semibold text-ink-mute">
                    Ctrl K
                  </kbd>
                </>
              )}
            </button>
            </RailTip>
          </div>

          {/* rail: no side padding (the 40px icons fill the ~58px card) and a hidden
              scrollbar, so nothing overflows sideways; still scrolls with wheel/touch */}
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-3',
              collapsed ? 'px-0 [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden' : 'px-3',
            )}
          >
            <NavTree rail={collapsed} />
          </div>

          <div className="space-y-2 border-t border-border p-3">
            {!collapsed && accent}
            <UserRow rail={collapsed} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top row: breadcrumb (desktop) / menu bar (mobile) */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:px-8 lg:pb-0 lg:pt-6 lg:backdrop-blur-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-ink-soft hover:text-ink lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-caption">
              <span className="text-ink-mute">{subtitle}</span>
              <ChevronRightIcon className="h-3 w-3 text-ink-mute" />
              <span className="font-semibold text-ink">{current}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setJumpOpen(true)}
              aria-label="Jump to a section"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-ink-soft lg:hidden"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
            {topBarActions}
          </div>
        </div>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:pt-3">
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
        <div className="flex min-h-full flex-col p-3">
          <div className="flex-1">
            <NavTree rail={false} />
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            {accent}
            <UserRow rail={false} />
          </div>
        </div>
      </Drawer>

      <JumpTo open={jumpOpen} onClose={() => setJumpOpen(false)} items={allItems} />
    </div>
  )
}

/** Small command palette listing every dashboard section. */
function JumpTo({ open, onClose, items }: { open: boolean; onClose: () => void; items: NavItem[] }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQ('')
    setActive(0)
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const shown = items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()))
  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-120 flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0b0a10]/45 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: easeEditorial }}
            role="dialog"
            aria-modal="true"
            aria-label="Jump to"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-3 shadow-[0_30px_80px_rgba(40,20,80,0.25)]"
          >
            <div className="flex h-12 items-center gap-3 rounded-2xl border-2 border-accent! px-4 ring-4 ring-accent/10">
              <SearchIcon className="h-4 w-4 text-accent" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && shown.length) {
                    e.preventDefault()
                    setActive((a) => (a + 1) % shown.length)
                  } else if (e.key === 'ArrowUp' && shown.length) {
                    e.preventDefault()
                    setActive((a) => (a - 1 + shown.length) % shown.length)
                  } else if (e.key === 'Enter' && shown[active]) {
                    go(shown[active].to)
                  }
                }}
                placeholder="Jump to a section…"
                aria-label="Jump to a section"
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-mute focus:ring-0"
              />
            </div>
            <ul className="mt-2 max-h-80 overflow-y-auto">
              {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-mute">No section matches.</li>}
              {shown.map((item, i) => (
                <li key={item.to}>
                  <button
                    type="button"
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(item.to)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      i === active ? 'bg-accent-soft text-accent' : 'text-ink-soft',
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    <span className="flex-1">{item.label}</span>
                    {i === active && <LuCornerDownLeft className="h-3.5 w-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
