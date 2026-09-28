import { createStore, makeId } from '@/shared/lib/createStore'
import type { PillTone } from '../components/TableKit'

/**
 * Access control data, shaped like Spatie laravel-permission so each store can
 * be swapped for API calls later:
 *   Permission.name  ↔ permissions.name   (e.g. "products.edit")
 *   Role.name        ↔ roles.name         (e.g. "super-admin")
 *   Role.permissions ↔ role_has_permissions
 *   AccessUser.roles ↔ model_has_roles, directPermissions ↔ model_has_permissions
 * Front-end only for now — saved in localStorage via createStore.
 */

/* ----------------------------- permissions ----------------------------- */

export interface Permission {
  /** unique key, "<module>.<action>" */
  name: string
  /** module heading it's grouped under */
  group: string
  label: string
  description?: string
  /** false for the built-in catalogue (can't be deleted) */
  custom?: boolean
}

const ACTION_LABEL: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
  moderate: 'Moderate',
  suspend: 'Suspend',
  cancel: 'Cancel',
  manage: 'Manage',
}

/** module → actions it supports */
const CATALOGUE: [group: string, slug: string, actions: string[]][] = [
  ['Dashboard', 'dashboard', ['view']],
  ['Products', 'products', ['view', 'create', 'edit', 'delete']],
  ['Inventory', 'inventory', ['view', 'edit']],
  ['Categories', 'categories', ['view', 'create', 'edit', 'delete']],
  ['Orders', 'orders', ['view', 'edit', 'cancel']],
  ['Returns', 'returns', ['view', 'approve']],
  ['Reviews', 'reviews', ['view', 'moderate']],
  ['Discounts', 'discounts', ['view', 'create', 'edit', 'delete']],
  ['Payouts', 'payouts', ['view', 'approve']],
  ['Reports', 'reports', ['view', 'export']],
  ['Vendors', 'vendors', ['view', 'approve', 'edit', 'suspend']],
  ['Customers', 'customers', ['view', 'edit']],
  ['Site content', 'content', ['view', 'edit']],
  ['Settings', 'settings', ['view', 'edit']],
  ['Access control', 'access', ['view', 'manage']],
]

const seedPermissions = (): Permission[] =>
  CATALOGUE.flatMap(([group, slug, actions]) =>
    actions.map((a) => ({
      name: `${slug}.${a}`,
      group,
      label: `${ACTION_LABEL[a] ?? a} ${group.toLowerCase()}`,
    })),
  )

export const permissionsStore = createStore<Permission[]>('access:permissions', seedPermissions)

/** the action part of a permission name, e.g. "edit" */
export const actionOf = (name: string) => name.split('.').pop() ?? name
export const actionLabel = (name: string) => ACTION_LABEL[actionOf(name)] ?? actionOf(name)

/** keeps module order from the catalogue, custom groups last */
export function groupPermissions(perms: Permission[]) {
  const order = CATALOGUE.map(([g]) => g)
  const map = new Map<string, Permission[]>()
  for (const p of perms) map.set(p.group, [...(map.get(p.group) ?? []), p])
  return [...map.entries()].sort(
    ([a], [b]) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999) || a.localeCompare(b),
  )
}

/* -------------------------------- roles -------------------------------- */

export type RoleColor = Extract<PillTone, 'accent' | 'success' | 'warning' | 'danger' | 'neutral'>
export const ROLE_COLORS: RoleColor[] = ['accent', 'success', 'warning', 'danger', 'neutral']

export interface Role {
  id: string
  /** Spatie role name — lowercase slug */
  name: string
  label: string
  description: string
  color: RoleColor
  permissions: string[]
  /** built-in roles can't be deleted or renamed */
  system: boolean
  createdAt: string
}

export const SUPER_ADMIN = 'super-admin'

const all = () => seedPermissions().map((p) => p.name)
const pick = (...prefixes: string[]) => all().filter((n) => prefixes.some((p) => n === p || n.startsWith(`${p}.`)))

const seedRoles = (): Role[] => {
  const at = '2026-09-08T09:00:00.000Z'
  return [
    { id: 'role-super-admin', name: SUPER_ADMIN, label: 'Super admin', description: 'Full access to everything, including who else has access.', color: 'accent', permissions: all(), system: true, createdAt: at },
    { id: 'role-admin', name: 'admin', label: 'Admin', description: 'Runs the marketplace day to day. Everything except access control.', color: 'accent', permissions: all().filter((n) => !n.startsWith('access.')), system: true, createdAt: at },
    { id: 'role-manager', name: 'manager', label: 'Manager', description: 'Looks after products, orders, vendors and customers.', color: 'success', permissions: ['dashboard.view', ...pick('products', 'orders', 'vendors', 'customers', 'returns', 'reports.view')], system: false, createdAt: at },
    { id: 'role-support', name: 'support', label: 'Support', description: 'Helps customers with orders and returns.', color: 'warning', permissions: ['dashboard.view', 'orders.view', 'orders.edit', 'customers.view', ...pick('returns')], system: false, createdAt: at },
    { id: 'role-content-editor', name: 'content-editor', label: 'Content editor', description: 'Edits site content, categories and product details.', color: 'neutral', permissions: ['dashboard.view', ...pick('content', 'categories'), 'products.view', 'products.edit'], system: false, createdAt: at },
    { id: 'role-finance', name: 'finance', label: 'Finance', description: 'Handles payouts and reports.', color: 'danger', permissions: ['dashboard.view', ...pick('payouts', 'reports'), 'orders.view'], system: false, createdAt: at },
    { id: 'role-vendor', name: 'vendor', label: 'Vendor', description: 'Shop owners. Uses the vendor dashboard, not this admin.', color: 'success', permissions: [], system: true, createdAt: at },
    { id: 'role-customer', name: 'customer', label: 'Customer', description: 'Shoppers with an account.', color: 'neutral', permissions: [], system: true, createdAt: at },
  ]
}

export const rolesStore = createStore<Role[]>('access:roles', seedRoles)

export const slugifyRole = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/* -------------------------------- users -------------------------------- */

export type AccessUserStatus = 'Active' | 'Invited' | 'Suspended'

export interface AccessUser {
  id: string
  name: string
  email: string
  roles: string[]
  directPermissions: string[]
  status: AccessUserStatus
  addedAt: string
  lastActive?: string
}

export const userStatusTone: Record<AccessUserStatus, PillTone> = {
  Active: 'success',
  Invited: 'accent',
  Suspended: 'danger',
}

/** old Staff page roles → new role names */
const LEGACY_ROLE: Record<string, string> = {
  Owner: SUPER_ADMIN,
  Manager: 'manager',
  Support: 'support',
  'Content editor': 'content-editor',
  Finance: 'finance',
}

const seedUsers = (): AccessUser[] => {
  const now = new Date().toISOString()
  const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

  // carry over anyone added on the old Staff page
  let legacy: AccessUser[] = []
  try {
    const raw = window.localStorage.getItem('marketplace:staff')
    const old = raw ? (JSON.parse(raw) as { id: string; name: string; email: string; role: string; status: AccessUserStatus; addedAt: string; lastActive?: string }[]) : []
    legacy = old.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email.toLowerCase(),
      roles: [LEGACY_ROLE[s.role] ?? 'support'],
      directPermissions: [],
      status: s.status,
      addedAt: s.addedAt,
      lastActive: s.lastActive,
    }))
  } catch {
    /* ignore */
  }

  const samples: AccessUser[] = [
    { id: 'u-owner', name: 'Super Admin', email: 'admin@ambalaeshop.test', roles: [SUPER_ADMIN], directPermissions: [], status: 'Active', addedAt: '2026-09-08T09:00:00.000Z', lastActive: now },
    { id: 'u-nadia', name: 'Nadia Rahman', email: 'nadia@ambalaeshop.test', roles: ['manager'], directPermissions: ['payouts.view'], status: 'Active', addedAt: day(40), lastActive: day(1) },
    { id: 'u-tanvir', name: 'Tanvir Hasan', email: 'tanvir@ambalaeshop.test', roles: ['support'], directPermissions: [], status: 'Active', addedAt: day(22), lastActive: day(0) },
    { id: 'u-sara', name: 'Sara Karim', email: 'sara@ambalaeshop.test', roles: ['content-editor'], directPermissions: [], status: 'Invited', addedAt: day(2) },
    { id: 'u-mira', name: 'Mira Haldorsen', email: 'lumen-atelier@vendor.ambalaeshop.test', roles: ['vendor'], directPermissions: [], status: 'Active', addedAt: day(20), lastActive: day(3) },
    { id: 'u-anders', name: 'Anders Vik', email: 'terra-ceramics@vendor.ambalaeshop.test', roles: ['vendor'], directPermissions: [], status: 'Suspended', addedAt: day(19) },
    { id: 'u-jordan', name: 'Jordan Lee', email: 'jordan@example.com', roles: ['customer'], directPermissions: [], status: 'Active', addedAt: day(10), lastActive: day(8) },
    { id: 'u-priya', name: 'Priya Das', email: 'priya@example.com', roles: ['customer'], directPermissions: [], status: 'Active', addedAt: day(12), lastActive: day(11) },
  ]

  const emails = new Set(legacy.map((u) => u.email))
  return [...legacy, ...samples.filter((s) => !emails.has(s.email))]
}

export const usersStore = createStore<AccessUser[]>('access:users', seedUsers)

export const newUserId = () => makeId('u')

/* ------------------------------- helpers ------------------------------- */

/** role permissions + direct permissions; super-admin gets everything */
export function effectivePermissions(user: AccessUser, roles: Role[], allPermissions: string[]) {
  if (user.roles.includes(SUPER_ADMIN)) return new Set(allPermissions)
  const set = new Set(user.directPermissions)
  for (const r of roles) if (user.roles.includes(r.name)) r.permissions.forEach((p) => set.add(p))
  return set
}

/** which roles grant a permission to this user (empty = direct only / none) */
export function sourcesOf(permission: string, user: AccessUser, roles: Role[]) {
  return roles.filter((r) => user.roles.includes(r.name) && (r.name === SUPER_ADMIN || r.permissions.includes(permission)))
}

export const isStaff = (u: AccessUser) => u.roles.some((r) => r !== 'vendor' && r !== 'customer')

/** true when this user is the only active super admin left */
export function isLastSuperAdmin(user: AccessUser, users: AccessUser[]) {
  if (!user.roles.includes(SUPER_ADMIN) || user.status !== 'Active') return false
  return users.filter((u) => u.status === 'Active' && u.roles.includes(SUPER_ADMIN)).length <= 1
}

export const roleByName = (roles: Role[], name: string) => roles.find((r) => r.name === name)
