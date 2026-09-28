import { Fragment, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LuChevronDown, LuKeyRound, LuPlus, LuShieldCheck, LuTrash2 } from 'react-icons/lu'
import { PageHeader } from '../../components/primitives'
import { TableSearch, TableToolbar } from '../../components/TableKit'
import { Button, Field, Input, Modal, Select, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import {
  SUPER_ADMIN,
  groupPermissions,
  permissionsStore,
  rolesStore,
  slugifyRole,
  usersStore,
  type Permission,
  type Role,
} from '../../access/store'
import { RoleDot } from '../../access/components'
import { CheckCell } from './AccessRoleEditor'

export function AccessPermissions() {
  const [permissions, setPermissions] = permissionsStore.useStore()
  const [roles, setRoles] = rolesStore.useStore()
  const [users, setUsers] = usersStore.useStore()
  const { notify } = useToast()

  const [q, setQ] = useState('')
  const [module, setModule] = useState('')
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  // vendor/customer roles don't use the admin panel — hidden unless asked for
  const [showAll, setShowAll] = useState(false)

  const columns = roles.filter((r) => showAll || (r.name !== 'vendor' && r.name !== 'customer'))
  const groups = useMemo(() => groupPermissions(permissions), [permissions])
  const term = q.trim().toLowerCase()
  const visible = groups
    .filter(([g]) => !module || g === module)
    .map(([g, list]) => [g, list.filter((p) => !term || p.label.toLowerCase().includes(term) || p.name.includes(term))] as const)
    .filter(([, list]) => list.length)

  const roleHas = (r: Role, n: string) => r.name === SUPER_ADMIN || r.permissions.includes(n)
  const setRolePerms = (role: Role, names: string[], on: boolean) => {
    if (role.name === SUPER_ADMIN) return
    setRoles((prev) =>
      prev.map((r) =>
        r.id === role.id
          ? { ...r, permissions: on ? [...new Set([...r.permissions, ...names])] : r.permissions.filter((x) => !names.includes(x)) }
          : r,
      ),
    )
  }

  const removePermission = (p: Permission) => {
    if (!confirm(`Delete “${p.label}”? It will be taken away from every role and user.`)) return
    setPermissions((prev) => prev.filter((x) => x.name !== p.name))
    setRoles((prev) => prev.map((r) => ({ ...r, permissions: r.permissions.filter((x) => x !== p.name) })))
    setUsers((prev) => prev.map((u) => ({ ...u, directPermissions: u.directPermissions.filter((x) => x !== p.name) })))
    notify(`Deleted “${p.label}”`, 'success')
  }

  const toggleGroup = (g: string) => setCollapsed((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]))

  return (
    <div className="space-y-4">
      <PageHeader
        title="Permissions"
        description="Every action someone can take in the admin. Tick a box to give that permission to a role — changes save straight away."
        action={
          <div className="flex gap-2">
            <Link
              to="/admin/access/roles"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50!"
            >
              <LuShieldCheck className="h-4 w-4" />
              Roles
            </Link>
            <Button onClick={() => setAdding(true)}>
              <LuPlus className="h-4 w-4" />
              Add permission
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-3">
          <TableToolbar
            end={
              <>
                <label className="flex items-center gap-2 text-caption font-semibold text-ink-soft">
                  <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="accent-[var(--accent)]" />
                  Show vendor & customer
                </label>
                <button
                  type="button"
                  onClick={() => setCollapsed(collapsed.length ? [] : groups.map(([g]) => g))}
                  className="h-9 rounded-xl border border-border px-3 text-caption font-semibold text-ink transition-colors hover:border-accent/50!"
                >
                  {collapsed.length ? 'Expand all' : 'Collapse all'}
                </button>
              </>
            }
          >
            <TableSearch value={q} onChange={setQ} placeholder="Search permissions…" />
            <div className="w-44">
              <Select
                size="sm"
                value={module}
                onChange={setModule}
                options={[{ value: '', label: 'All modules' }, ...groups.map(([g]) => ({ value: g, label: g }))]}
              />
            </div>
          </TableToolbar>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 min-w-64 bg-surface px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-mute">
                  Permission
                </th>
                {columns.map((r) => {
                  const count = users.filter((u) => u.roles.includes(r.name)).length
                  return (
                    <th key={r.id} className="min-w-28 px-2 py-3 text-center align-bottom">
                      <Link to={`/admin/access/roles/${r.id}`} className="group inline-flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1.5 text-caption font-semibold text-ink group-hover:text-accent">
                          <RoleDot color={r.color} />
                          {r.label}
                        </span>
                        <span className="text-[11px] font-normal text-ink-mute tabular-nums">
                          {count} {count === 1 ? 'person' : 'people'}
                        </span>
                      </Link>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-caption text-ink-mute">
                    No permissions match.
                  </td>
                </tr>
              )}
              {visible.map(([group, list]) => {
                const open = !collapsed.includes(group) || !!term
                const names = list.map((p) => p.name)
                return (
                  <Fragment key={group}>
                    {/* module row */}
                    <tr className="bg-surface-sunken/60">
                      <td className="sticky left-0 z-10 border-t border-border bg-surface-sunken px-4 py-2.5">
                        <button type="button" onClick={() => toggleGroup(group)} aria-expanded={open} className="flex items-center gap-2 font-semibold text-ink">
                          <LuChevronDown className={cn('h-4 w-4 text-ink-mute transition-transform', !open && '-rotate-90')} />
                          {group}
                          <span className="text-caption font-normal text-ink-mute">{list.length}</span>
                        </button>
                      </td>
                      {columns.map((r) => {
                        const on = names.filter((n) => roleHas(r, n)).length
                        const full = on === names.length
                        return (
                          <td key={r.id} className="border-t border-border px-2 py-2.5 text-center">
                            <button
                              type="button"
                              disabled={r.name === SUPER_ADMIN}
                              onClick={() => setRolePerms(r, names, !full)}
                              title={full ? `Remove all ${group} from ${r.label}` : `Give all ${group} to ${r.label}`}
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors disabled:cursor-not-allowed',
                                full ? 'bg-accent text-on-accent' : on ? 'bg-accent-soft text-accent' : 'bg-surface text-ink-mute ring-1 ring-border hover:text-ink',
                              )}
                            >
                              {on}/{names.length}
                            </button>
                          </td>
                        )
                      })}
                    </tr>

                    {open &&
                      list.map((p) => (
                        <tr key={p.name} className="group/row hover:bg-accent-soft/20">
                          <td className="sticky left-0 z-10 border-t border-border bg-surface px-4 py-2.5 group-hover/row:bg-[color-mix(in_srgb,var(--accent-soft)_20%,var(--surface))]">
                            <div className="flex items-center gap-2 pl-6">
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 text-ink">
                                  {p.label}
                                  {p.custom && (
                                    <span className="rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">Custom</span>
                                  )}
                                </span>
                                <span className="block font-mono text-[11px] text-ink-mute">{p.name}</span>
                              </span>
                              {p.custom && (
                                <button
                                  type="button"
                                  onClick={() => removePermission(p)}
                                  aria-label={`Delete ${p.label}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-mute opacity-0 transition hover:bg-danger-soft hover:text-danger group-hover/row:opacity-100 focus:opacity-100"
                                >
                                  <LuTrash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          {columns.map((r) => (
                            <td key={r.id} className="border-t border-border px-2 py-2 text-center">
                              <CheckCell
                                on={roleHas(r, p.name)}
                                disabled={r.name === SUPER_ADMIN}
                                label={`${p.label} for ${r.label}`}
                                onClick={() => setRolePerms(r, [p.name], !roleHas(r, p.name))}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="flex items-center gap-2 border-t border-border px-4 py-3 text-caption text-ink-mute">
          <LuKeyRound className="h-3.5 w-3.5" />
          {permissions.length} permissions across {groups.length} modules. Super admin always has all of them.
        </p>
      </div>

      {adding && (
        <AddPermissionModal
          groups={groups.map(([g]) => g)}
          taken={permissions.map((p) => p.name)}
          onClose={() => setAdding(false)}
          onAdd={(p) => {
            setPermissions((prev) => [...prev, p])
            setAdding(false)
            notify(`Added “${p.label}”`, 'success')
          }}
        />
      )}
    </div>
  )
}

function AddPermissionModal({
  groups,
  taken,
  onClose,
  onAdd,
}: {
  groups: string[]
  taken: string[]
  onClose: () => void
  onAdd: (p: Permission) => void
}) {
  const NEW = '__new__'
  const [group, setGroup] = useState(groups[0] ?? NEW)
  const [newGroup, setNewGroup] = useState('')
  const [action, setAction] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')

  const groupName = group === NEW ? newGroup.trim() : group
  const name = groupName && action.trim() ? `${slugifyRole(groupName)}.${slugifyRole(action)}` : ''
  const duplicate = !!name && taken.includes(name)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name || duplicate) return
    onAdd({
      name,
      group: groupName,
      label: label.trim() || `${action.trim()} ${groupName.toLowerCase()}`,
      description: description.trim() || undefined,
      custom: true,
    })
  }

  return (
    <Modal open onClose={onClose} title="Add permission">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Module" required>
          {() => (
            <Select
              value={group}
              onChange={setGroup}
              options={[...groups.map((g) => ({ value: g, label: g })), { value: NEW, label: '+ New module…' }]}
            />
          )}
        </Field>
        {group === NEW && (
          <Field label="New module name" required>
            {(id) => <Input id={id} required value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="e.g. Warehouse" />}
          </Field>
        )}
        <Field label="Action" required hint="A verb, like export, publish or refund.">
          {(id) => <Input id={id} required value={action} onChange={(e) => setAction(e.target.value)} placeholder="export" />}
        </Field>
        <Field label="Label" hint="What people see. Leave empty to build one from the action.">
          {(id) => <Input id={id} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Export orders" />}
        </Field>
        <Field label="Description">
          {(id) => <Textarea id={id} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>

        <div className="flex items-center justify-between rounded-xl bg-surface-sunken/60 px-3.5 py-2.5 text-caption">
          <span className="text-ink-mute">System name</span>
          <span className={cn('font-mono font-semibold', duplicate ? 'text-danger' : 'text-ink')}>{name || '—'}</span>
        </div>
        {duplicate && <p className="text-caption text-danger">That permission already exists.</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name || duplicate}>
            Add permission
          </Button>
        </div>
      </form>
    </Modal>
  )
}
