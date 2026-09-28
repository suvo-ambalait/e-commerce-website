import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LuBan, LuCheck, LuKeyRound, LuMail, LuShieldCheck, LuTrash2, LuUserMinus, LuUserPlus, LuUsers } from 'react-icons/lu'
import { PageHeader, StatCard, StatGrid, FadeItem, DataTable, BulkButton, type Column } from '../../components/primitives'
import { Pill, TableSearch, TableTabs, TableToolbar } from '../../components/TableKit'
import { Avatar, Button, Drawer, Field, Input, Modal, Select } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { formatDate } from '@/shared/lib/format'
import { timeAgo } from '../../components/DashboardWidgets'
import {
  SUPER_ADMIN,
  effectivePermissions,
  groupPermissions,
  isLastSuperAdmin,
  isStaff,
  newUserId,
  permissionsStore,
  roleByName,
  rolesStore,
  sourcesOf,
  userStatusTone,
  usersStore,
  type AccessUser,
  type Role,
} from '../../access/store'
import { RoleChip, RoleDot, SectionLabel } from '../../access/components'

type Tab = 'all' | 'staff' | 'vendor' | 'customer' | 'suspended'

export function AccessUsers() {
  const [users, setUsers] = usersStore.useStore()
  const [roles] = rolesStore.useStore()
  const [permissions] = permissionsStore.useStore()
  const { notify } = useToast()

  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [inviting, setInviting] = useState(false)
  const [managing, setManaging] = useState<AccessUser | null>(null)
  const [bulk, setBulk] = useState<{ keys: string[]; mode: 'add' | 'remove' } | null>(null)

  const update = (id: string, patch: Partial<AccessUser>) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))

  const counts = {
    all: users.length,
    staff: users.filter(isStaff).length,
    vendor: users.filter((u) => u.roles.includes('vendor')).length,
    customer: users.filter((u) => u.roles.includes('customer')).length,
    suspended: users.filter((u) => u.status === 'Suspended').length,
  }

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return users.filter((u) => {
      if (tab === 'staff' && !isStaff(u)) return false
      if ((tab === 'vendor' || tab === 'customer') && !u.roles.includes(tab)) return false
      if (tab === 'suspended' && u.status !== 'Suspended') return false
      if (roleFilter && !u.roles.includes(roleFilter)) return false
      return !term || u.name.toLowerCase().includes(term) || u.email.includes(term)
    })
  }, [users, tab, q, roleFilter])

  const columns: Column<AccessUser>[] = [
    {
      header: 'User',
      id: 'user',
      sortValue: (u) => u.name,
      cell: (u) => (
        <span className="flex items-center gap-3">
          <span className="relative">
            <Avatar name={u.name} size={36} className="bg-accent-soft! text-accent!" />
            {u.roles.includes(SUPER_ADMIN) && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-on-accent ring-2 ring-surface">
                <LuShieldCheck className="h-2.5 w-2.5" />
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block max-w-56 truncate font-semibold text-ink">{u.name}</span>
            <span className="block max-w-56 truncate text-caption text-ink-mute">{u.email}</span>
          </span>
        </span>
      ),
    },
    {
      header: 'Roles',
      id: 'roles',
      sortValue: (u) => u.roles.join(','),
      cell: (u) => (
        <span className="flex max-w-64 flex-wrap gap-1">
          {u.roles.length ? (
            u.roles.map((r) => <RoleChip key={r} name={r} role={roleByName(roles, r)} />)
          ) : (
            <span className="text-caption text-ink-mute">No role</span>
          )}
          {u.directPermissions.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
              <LuKeyRound className="h-2.5 w-2.5" />+{u.directPermissions.length}
            </span>
          )}
        </span>
      ),
    },
    {
      header: 'Access',
      id: 'access',
      hideBelow: 'lg',
      sortValue: (u) => effectivePermissions(u, roles, permissions.map((p) => p.name)).size,
      cell: (u) => {
        const n = effectivePermissions(u, roles, permissions.map((p) => p.name)).size
        return (
          <span className="text-caption text-ink-soft tabular-nums">
            <span className="font-semibold text-ink">{n}</span> / {permissions.length}
          </span>
        )
      },
    },
    {
      header: 'Status',
      id: 'status',
      hideBelow: 'sm',
      sortValue: (u) => u.status,
      cell: (u) => (
        <Pill tone={userStatusTone[u.status]} dot>
          {u.status}
        </Pill>
      ),
    },
    {
      header: 'Last active',
      id: 'active',
      hideBelow: 'md',
      sortValue: (u) => u.lastActive ?? '',
      cell: (u) => (
        <span>
          <span className="block text-ink-soft">{u.lastActive ? timeAgo(u.lastActive) : 'Never'}</span>
          <span className="block text-caption text-ink-mute">Added {formatDate(u.addedAt)}</span>
        </span>
      ),
    },
  ]

  const applyBulk = (keys: string[], roleName: string, mode: 'add' | 'remove') => {
    let blocked = 0
    setUsers((prev) =>
      prev.map((u) => {
        if (!keys.includes(u.id)) return u
        if (mode === 'remove' && roleName === SUPER_ADMIN && isLastSuperAdmin(u, prev)) {
          blocked++
          return u
        }
        const next = mode === 'add' ? [...new Set([...u.roles, roleName])] : u.roles.filter((r) => r !== roleName)
        return { ...u, roles: next }
      }),
    )
    const label = roleByName(roles, roleName)?.label ?? roleName
    notify(
      blocked
        ? `Updated, but kept ${label} on the last super admin`
        : `${mode === 'add' ? 'Gave' : 'Removed'} ${label} ${mode === 'add' ? 'to' : 'from'} ${keys.length} user${keys.length === 1 ? '' : 's'}`,
      'success',
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Everyone who can sign in, and the roles that decide what they can do."
        action={
          <div className="flex gap-2">
            <Link
              to="/admin/access/roles"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50!"
            >
              <LuShieldCheck className="h-4 w-4" />
              Roles
            </Link>
            <Button onClick={() => setInviting(true)}>
              <LuUserPlus className="h-4 w-4" />
              Invite user
            </Button>
          </div>
        }
      />

      <StatGrid>
        <FadeItem>
          <StatCard label="Total users" value={String(users.length)} hint={`${counts.customer} customers · ${counts.vendor} vendors`} icon={LuUsers} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Admin & staff" value={String(counts.staff)} hint={`${users.filter((u) => u.roles.includes(SUPER_ADMIN)).length} super admin`} icon={LuShieldCheck} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Pending invites" value={String(users.filter((u) => u.status === 'Invited').length)} hint="Haven’t signed in yet" icon={LuMail} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Suspended" value={String(counts.suspended)} hint="Can’t sign in" icon={LuBan} tone={counts.suspended ? 'warning' : 'default'} />
        </FadeItem>
      </StatGrid>

      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(u) => u.id}
        empty="No users match."
        defaultSort={{ id: 'user', dir: 'asc' }}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        toolbar={
          <TableToolbar
            end={
              <div className="w-44">
                <Select
                  size="sm"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={[{ value: '', label: 'All roles' }, ...roles.map((r) => ({ value: r.name, label: r.label }))]}
                />
              </div>
            }
          >
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: counts.all },
                { value: 'staff', label: 'Staff', count: counts.staff },
                { value: 'vendor', label: 'Vendors', count: counts.vendor },
                { value: 'customer', label: 'Customers', count: counts.customer },
                { value: 'suspended', label: 'Suspended', count: counts.suspended },
              ]}
            />
            <TableSearch value={q} onChange={setQ} placeholder="Search name or email…" />
          </TableToolbar>
        }
        rowActions={[
          { label: 'Manage access', icon: LuKeyRound, onClick: (u) => setManaging(u) },
          { label: 'Resend invite', icon: LuMail, onClick: (u) => notify(`Invite sent again to ${u.email}`), hidden: (u) => u.status !== 'Invited' },
          {
            label: 'Suspend',
            icon: LuBan,
            hidden: (u) => u.status === 'Suspended',
            onClick: (u) => {
              if (isLastSuperAdmin(u, users)) return notify('You can’t suspend the last super admin')
              update(u.id, { status: 'Suspended' })
              notify(`${u.name} is suspended`, 'success')
            },
          },
          { label: 'Reactivate', icon: LuCheck, hidden: (u) => u.status !== 'Suspended', onClick: (u) => update(u.id, { status: 'Active' }) },
          {
            label: 'Remove',
            icon: LuTrash2,
            danger: true,
            onClick: (u) => {
              if (isLastSuperAdmin(u, users)) return notify('You can’t remove the last super admin')
              if (confirm(`Remove ${u.name}? They lose access straight away.`)) {
                setUsers((prev) => prev.filter((x) => x.id !== u.id))
                notify(`${u.name} removed`, 'success')
              }
            },
          },
        ]}
        bulkBar={(keys) => (
          <>
            <span className="px-2 text-sm font-semibold tabular-nums">{keys.length} selected</span>
            <BulkButton icon={LuShieldCheck} onClick={() => setBulk({ keys, mode: 'add' })}>
              Assign role
            </BulkButton>
            <BulkButton icon={LuUserMinus} onClick={() => setBulk({ keys, mode: 'remove' })}>
              Remove role
            </BulkButton>
          </>
        )}
      />

      {inviting && (
        <InviteModal
          roles={roles}
          taken={users.map((u) => u.email)}
          onClose={() => setInviting(false)}
          onInvite={(u) => {
            setUsers((prev) => [...prev, u])
            setInviting(false)
            notify(`Invite sent to ${u.email}`, 'success')
          }}
        />
      )}

      {bulk && (
        <BulkRoleModal
          mode={bulk.mode}
          roles={roles}
          count={bulk.keys.length}
          onClose={() => setBulk(null)}
          onApply={(roleName) => {
            applyBulk(bulk.keys, roleName, bulk.mode)
            setBulk(null)
            setSelected([])
          }}
        />
      )}

      <ManageAccessDrawer
        user={managing}
        users={users}
        roles={roles}
        onClose={() => setManaging(null)}
        onSave={(patch) => {
          if (!managing) return
          update(managing.id, patch)
          notify(`Access updated for ${managing.name}`, 'success')
          setManaging(null)
        }}
      />
    </div>
  )
}

/* ------------------------------ invite modal ------------------------------ */

function InviteModal({
  roles,
  taken,
  onClose,
  onInvite,
}: {
  roles: Role[]
  taken: string[]
  onClose: () => void
  onInvite: (u: AccessUser) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [picked, setPicked] = useState<string[]>(['support'])
  const duplicate = taken.includes(email.trim().toLowerCase())
  const pickable = roles.filter((r) => r.name !== 'customer')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (duplicate || !picked.length) return
    onInvite({
      id: newUserId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      roles: picked,
      directPermissions: [],
      status: 'Invited',
      addedAt: new Date().toISOString(),
    })
  }

  return (
    <Modal open onClose={onClose} title="Invite user" size="lg">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            {(id) => <Input id={id} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nadia Rahman" />}
          </Field>
          <Field label="Email" required error={duplicate ? 'This person already has an account.' : undefined}>
            {(id) => <Input id={id} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />}
          </Field>
        </div>

        <div>
          <SectionLabel hint={`${picked.length} selected`}>Roles</SectionLabel>
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {pickable.map((r) => {
              const on = picked.includes(r.name)
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== r.name) : [...p, r.name]))}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                    on ? 'border-accent! bg-accent-soft/60' : 'border-border-strong hover:border-accent/50!',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-colors',
                      on ? 'border-accent! bg-accent text-on-accent' : 'border-border-strong bg-surface',
                    )}
                  >
                    {on && <LuCheck className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      <RoleDot color={r.color} />
                      {r.label}
                    </span>
                    <span className="mt-0.5 block text-caption text-ink-mute">{r.description}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-ink-soft tabular-nums">
                      {r.name === SUPER_ADMIN ? 'All' : r.permissions.length} permissions
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          {!picked.length && <p className="mt-2 text-caption text-danger">Pick at least one role.</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={duplicate || !picked.length}>
            <LuMail className="h-4 w-4" />
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/* ---------------------------- bulk role modal ---------------------------- */

function BulkRoleModal({
  mode,
  roles,
  count,
  onClose,
  onApply,
}: {
  mode: 'add' | 'remove'
  roles: Role[]
  count: number
  onClose: () => void
  onApply: (roleName: string) => void
}) {
  const [role, setRole] = useState(roles.find((r) => r.name !== SUPER_ADMIN)?.name ?? roles[0]?.name ?? '')
  return (
    <Modal open onClose={onClose} title={mode === 'add' ? 'Assign a role' : 'Remove a role'}>
      <p className="text-sm text-ink-soft">
        {mode === 'add' ? 'Give' : 'Take'} this role {mode === 'add' ? 'to' : 'from'}{' '}
        <span className="font-semibold text-ink">
          {count} user{count === 1 ? '' : 's'}
        </span>
        . Their other roles stay as they are.
      </p>
      <div className="mt-4 grid gap-1.5">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={role === r.name}
            onClick={() => setRole(r.name)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
              role === r.name ? 'border-accent! bg-accent-soft/60 font-semibold text-ink' : 'border-border hover:border-accent/50! text-ink-soft',
            )}
          >
            <RoleDot color={r.color} />
            {r.label}
            <span className="ml-auto text-caption text-ink-mute">{r.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={mode === 'remove' ? 'danger' : 'primary'} onClick={() => onApply(role)} disabled={!role}>
          {mode === 'add' ? 'Assign role' : 'Remove role'}
        </Button>
      </div>
    </Modal>
  )
}

/* -------------------------- manage access drawer -------------------------- */

function ManageAccessDrawer({
  user,
  users,
  roles,
  onClose,
  onSave,
}: {
  user: AccessUser | null
  users: AccessUser[]
  roles: Role[]
  onClose: () => void
  onSave: (patch: Pick<AccessUser, 'roles' | 'directPermissions'>) => void
}) {
  return (
    <Drawer open={!!user} onClose={onClose} title="Manage access" widthClass="w-full max-w-lg">
      {user && <ManageAccessBody key={user.id} user={user} users={users} roles={roles} onClose={onClose} onSave={onSave} />}
    </Drawer>
  )
}

function ManageAccessBody({
  user,
  users,
  roles,
  onClose,
  onSave,
}: {
  user: AccessUser
  users: AccessUser[]
  roles: Role[]
  onClose: () => void
  onSave: (patch: Pick<AccessUser, 'roles' | 'directPermissions'>) => void
}) {
  const [permissions] = permissionsStore.useStore()
  const [draftRoles, setDraftRoles] = useState(user.roles)
  const [direct, setDirect] = useState(user.directPermissions)
  const draft: AccessUser = { ...user, roles: draftRoles, directPermissions: direct }
  const all = permissions.map((p) => p.name)
  const effective = effectivePermissions(draft, roles, all)
  const lockedSuper = isLastSuperAdmin(user, users)
  const isSuper = draftRoles.includes(SUPER_ADMIN)
  const dirty =
    draftRoles.slice().sort().join() !== user.roles.slice().sort().join() ||
    direct.slice().sort().join() !== user.directPermissions.slice().sort().join()

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6 p-5">
        {/* who */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface-sunken/60 p-3.5">
          <Avatar name={user.name} size={44} className="bg-accent-soft! text-accent!" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{user.name}</p>
            <p className="truncate text-caption text-ink-mute">{user.email}</p>
          </div>
          <Pill tone={userStatusTone[user.status]} dot>
            {user.status}
          </Pill>
        </div>

        {/* roles */}
        <div>
          <SectionLabel hint={`${draftRoles.length} of ${roles.length}`}>Roles</SectionLabel>
          <div className="grid gap-1.5">
            {roles.map((r) => {
              const on = draftRoles.includes(r.name)
              const locked = r.name === SUPER_ADMIN && on && lockedSuper
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={locked}
                  aria-pressed={on}
                  title={locked ? 'The last super admin must keep this role' : undefined}
                  onClick={() => setDraftRoles((p) => (on ? p.filter((x) => x !== r.name) : [...p, r.name]))}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed',
                    on ? 'border-accent! bg-accent-soft/50' : 'border-border hover:border-accent/50!',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border',
                      on ? 'border-accent! bg-accent text-on-accent' : 'border-border-strong bg-surface',
                    )}
                  >
                    {on && <LuCheck className="h-3 w-3" />}
                  </span>
                  <RoleDot color={r.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{r.label}</span>
                    <span className="block truncate text-caption text-ink-mute">{r.description}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-ink-mute tabular-nums">
                    {r.name === SUPER_ADMIN ? 'All' : r.permissions.length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* permissions */}
        <div>
          <SectionLabel hint={`${effective.size} of ${all.length} allowed`}>Permissions</SectionLabel>
          <p className="mb-3 text-caption text-ink-mute">
            Ticks from a role are locked. Tick anything else to give this person an extra permission.
          </p>
          {isSuper ? (
            <p className="rounded-xl bg-accent-soft/60 px-3.5 py-3 text-sm text-ink-soft">
              <span className="font-semibold text-ink">Super admin</span> has every permission, now and in the future.
            </p>
          ) : (
            <div className="space-y-3">
              {groupPermissions(permissions).map(([group, perms]) => (
                <div key={group} className="rounded-xl border border-border">
                  <p className="border-b border-border px-3 py-2 text-caption font-semibold text-ink">{group}</p>
                  <ul className="divide-y divide-border">
                    {perms.map((p) => {
                      const via = sourcesOf(p.name, draft, roles)
                      const fromRole = via.length > 0
                      const on = fromRole || direct.includes(p.name)
                      return (
                        <li key={p.name}>
                          <label
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2 text-sm',
                              fromRole ? 'cursor-default' : 'cursor-pointer hover:bg-surface-sunken/50',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={on}
                              disabled={fromRole}
                              onChange={() =>
                                setDirect((d) => (d.includes(p.name) ? d.filter((x) => x !== p.name) : [...d, p.name]))
                              }
                            />
                            <span
                              className={cn(
                                'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
                                on
                                  ? fromRole
                                    ? 'border-accent/40! bg-accent/40 text-on-accent'
                                    : 'border-accent! bg-accent text-on-accent'
                                  : 'border-border-strong bg-surface',
                              )}
                            >
                              {on && <LuCheck className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1 text-ink-soft">{p.label}</span>
                            {fromRole ? (
                              <span className="shrink-0 text-[11px] text-ink-mute">via {via.map((r) => r.label).join(', ')}</span>
                            ) : (
                              direct.includes(p.name) && (
                                <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">Extra</span>
                              )
                            )}
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* sticky save bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-surface px-5 py-3.5">
        <p className="text-caption text-ink-mute">{dirty ? 'Unsaved changes' : 'No changes yet'}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!dirty} onClick={() => onSave({ roles: draftRoles, directPermissions: direct })}>
            Save access
          </Button>
        </div>
      </div>
    </div>
  )
}
