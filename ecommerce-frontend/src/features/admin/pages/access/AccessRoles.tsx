import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LuCopy, LuKeyRound, LuLock, LuPencil, LuPlus, LuShieldCheck, LuTrash2, LuUsers } from 'react-icons/lu'
import { PageHeader, StatCard, StatGrid, FadeItem } from '../../components/primitives'
import { TableSearch } from '../../components/TableKit'
import { Avatar, Button, Modal } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { makeId } from '@/shared/lib/createStore'
import { easeEditorial } from '@/shared/lib/motion'
import { SUPER_ADMIN, permissionsStore, rolesStore, slugifyRole, usersStore, type Role } from '../../access/store'
import { CoverageBar, RoleDot, roleChipTone } from '../../access/components'

export function AccessRoles() {
  const [roles, setRoles] = rolesStore.useStore()
  const [users, setUsers] = usersStore.useStore()
  const [permissions] = permissionsStore.useStore()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [deleting, setDeleting] = useState<Role | null>(null)

  const membersOf = (r: Role) => users.filter((u) => u.roles.includes(r.name))
  const term = q.trim().toLowerCase()
  const shown = roles.filter((r) => !term || r.label.toLowerCase().includes(term) || r.name.includes(term))

  const duplicate = (r: Role) => {
    let label = `${r.label} copy`
    let n = 2
    while (roles.some((x) => x.name === slugifyRole(label))) label = `${r.label} copy ${n++}`
    const copy: Role = {
      ...r,
      id: makeId('role'),
      name: slugifyRole(label),
      label,
      system: false,
      permissions: r.name === SUPER_ADMIN ? permissions.map((p) => p.name) : [...r.permissions],
      createdAt: new Date().toISOString(),
    }
    setRoles((prev) => [...prev, copy])
    notify(`Created “${label}”`, 'success')
    navigate(`/admin/access/roles/${copy.id}`)
  }

  const remove = (r: Role, reassignTo?: string) => {
    if (reassignTo !== undefined) {
      setUsers((prev) =>
        prev.map((u) =>
          u.roles.includes(r.name)
            ? { ...u, roles: [...new Set(u.roles.filter((x) => x !== r.name).concat(reassignTo ? [reassignTo] : []))] }
            : u,
        ),
      )
    }
    setRoles((prev) => prev.filter((x) => x.id !== r.id))
    notify(`Deleted “${r.label}”`, 'success')
    setDeleting(null)
  }

  const custom = roles.filter((r) => !r.system).length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles"
        description="A role is a named set of permissions. Give people roles instead of setting permissions one by one."
        action={
          <div className="flex gap-2">
            <Link
              to="/admin/access/permissions"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50!"
            >
              <LuKeyRound className="h-4 w-4" />
              Permission matrix
            </Link>
            <Button onClick={() => navigate('/admin/access/roles/new')}>
              <LuPlus className="h-4 w-4" />
              New role
            </Button>
          </div>
        }
      />

      <StatGrid>
        <FadeItem>
          <StatCard label="Roles" value={String(roles.length)} hint={`${roles.length - custom} built-in · ${custom} custom`} icon={LuShieldCheck} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Permissions" value={String(permissions.length)} hint={`${permissions.filter((p) => p.custom).length} custom`} icon={LuKeyRound} />
        </FadeItem>
        <FadeItem>
          <StatCard label="People with a role" value={String(users.filter((u) => u.roles.length).length)} hint={`${users.filter((u) => !u.roles.length).length} without one`} icon={LuUsers} />
        </FadeItem>
        <FadeItem>
          <StatCard
            label="Unused roles"
            value={String(roles.filter((r) => membersOf(r).length === 0).length)}
            hint="No one has these yet"
            icon={LuLock}
          />
        </FadeItem>
      </StatGrid>

      <div className="flex items-center justify-between gap-3">
        <TableSearch value={q} onChange={setQ} placeholder="Search roles…" />
        <p className="text-caption text-ink-mute">
          {shown.length} role{shown.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {shown.map((r, i) => {
          const members = membersOf(r)
          const count = r.name === SUPER_ADMIN ? permissions.length : r.permissions.filter((p) => permissions.some((x) => x.name === p)).length
          return (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: easeEditorial }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-[border-color,box-shadow] hover:border-accent/40! hover:shadow-[0_14px_34px_rgba(40,20,80,0.08)]"
            >
              {/* colour stripe */}
              <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', roleChipTone[r.color].split(' ')[0])} />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 font-display! text-base font-bold! tracking-[-0.01em]! text-ink">
                    <RoleDot color={r.color} />
                    <span className="truncate">{r.label}</span>
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-mute">{r.name}</p>
                </div>
                {r.system ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                    <LuLock className="h-2.5 w-2.5" />
                    Built-in
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                    Custom
                  </span>
                )}
              </div>

              <p className="mt-3 line-clamp-2 min-h-10 text-sm text-ink-soft">{r.description || 'No description.'}</p>

              <CoverageBar className="mt-4" value={count} total={permissions.length} />

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="flex min-w-0 items-center gap-2">
                  {members.length > 0 ? (
                    <span className="flex -space-x-2">
                      {members.slice(0, 4).map((m) => (
                        <Avatar key={m.id} name={m.name} size={26} className="bg-accent-soft! text-[10px]! text-accent! ring-2 ring-surface" />
                      ))}
                    </span>
                  ) : null}
                  <span className="truncate text-caption text-ink-mute">
                    {members.length ? `${members.length} ${members.length === 1 ? 'person' : 'people'}` : 'No one yet'}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-1">
                  <IconAction label="Duplicate" onClick={() => duplicate(r)}>
                    <LuCopy className="h-4 w-4" />
                  </IconAction>
                  {!r.system && (
                    <IconAction label="Delete" danger onClick={() => setDeleting(r)}>
                      <LuTrash2 className="h-4 w-4" />
                    </IconAction>
                  )}
                  <Link
                    to={`/admin/access/roles/${r.id}`}
                    className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-caption font-semibold text-bg transition-opacity hover:opacity-90"
                  >
                    <LuPencil className="h-3.5 w-3.5" />
                    {r.name === SUPER_ADMIN ? 'View' : 'Edit'}
                  </Link>
                </span>
              </div>
            </motion.article>
          )
        })}

        {/* new role tile */}
        <button
          type="button"
          onClick={() => navigate('/admin/access/roles/new')}
          className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong! text-ink-mute transition-colors hover:border-accent! hover:bg-accent-soft/30 hover:text-accent"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-sunken">
            <LuPlus className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">Create a role</span>
          <span className="text-caption">Pick exactly what it can do</span>
        </button>
      </div>

      {deleting && (
        <DeleteRoleModal
          role={deleting}
          members={membersOf(deleting).length}
          others={roles.filter((r) => r.id !== deleting.id)}
          onClose={() => setDeleting(null)}
          onConfirm={(reassignTo) => remove(deleting, reassignTo)}
        />
      )}
    </div>
  )
}

function IconAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-surface-sunken',
        danger ? 'hover:text-danger' : 'hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function DeleteRoleModal({
  role,
  members,
  others,
  onClose,
  onConfirm,
}: {
  role: Role
  members: number
  others: Role[]
  onClose: () => void
  /** undefined = no members; '' = just remove the role from them */
  onConfirm: (reassignTo?: string) => void
}) {
  const [target, setTarget] = useState('')
  return (
    <Modal open onClose={onClose} title={`Delete “${role.label}”?`}>
      {members === 0 ? (
        <p className="text-sm text-ink-soft">No one has this role, so nothing else changes.</p>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">
              {members} {members === 1 ? 'person has' : 'people have'}
            </span>{' '}
            this role. Move them to another role, or just remove it from them.
          </p>
          <div className="mt-4 grid gap-1.5">
            <button
              type="button"
              aria-pressed={target === ''}
              onClick={() => setTarget('')}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                target === '' ? 'border-accent! bg-accent-soft/60 font-semibold text-ink' : 'border-border text-ink-soft hover:border-accent/50!',
              )}
            >
              Don’t move them
            </button>
            {others
              .filter((r) => r.name !== SUPER_ADMIN)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={target === r.name}
                  onClick={() => setTarget(r.name)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                    target === r.name ? 'border-accent! bg-accent-soft/60 font-semibold text-ink' : 'border-border text-ink-soft hover:border-accent/50!',
                  )}
                >
                  <RoleDot color={r.color} />
                  Move to {r.label}
                </button>
              ))}
          </div>
        </>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => onConfirm(members ? target : undefined)}>
          <LuTrash2 className="h-4 w-4" />
          Delete role
        </Button>
      </div>
    </Modal>
  )
}
