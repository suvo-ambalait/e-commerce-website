import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LuArrowLeft, LuCheck, LuEye, LuLock, LuShieldCheck, LuUsers } from 'react-icons/lu'
import { Panel } from '../../components/primitives'
import { Field, Input, Switch, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { makeId } from '@/shared/lib/createStore'
import {
  ROLE_COLORS,
  SUPER_ADMIN,
  actionLabel,
  actionOf,
  groupPermissions,
  permissionsStore,
  rolesStore,
  slugifyRole,
  usersStore,
  type Role,
  type RoleColor,
} from '../../access/store'
import { CoverageBar, RoleChip, roleDotTone } from '../../access/components'

export function AccessRoleEditor() {
  const { id } = useParams()
  const [roles, setRoles] = rolesStore.useStore()
  const [users] = usersStore.useStore()
  const [permissions] = permissionsStore.useStore()
  const { notify } = useToast()
  const navigate = useNavigate()

  const existing = id ? roles.find((r) => r.id === id) : undefined
  const isNew = !existing
  const isSuper = existing?.name === SUPER_ADMIN
  const locked = !!existing?.system

  const [label, setLabel] = useState(existing?.label ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [nameTouched, setNameTouched] = useState(!!existing)
  const [description, setDescription] = useState(existing?.description ?? '')
  const [color, setColor] = useState<RoleColor>(existing?.color ?? 'accent')
  const [perms, setPerms] = useState<string[]>(
    isSuper ? permissions.map((p) => p.name) : (existing?.permissions ?? ['dashboard.view']),
  )

  const slug = nameTouched ? slugifyRole(name) : slugifyRole(label)
  const taken = roles.some((r) => r.name === slug && r.id !== existing?.id)
  const members = existing ? users.filter((u) => u.roles.includes(existing.name)) : []
  const groups = useMemo(() => groupPermissions(permissions), [permissions])
  const actions = useMemo(() => {
    const seen: string[] = []
    for (const p of permissions) if (!seen.includes(actionOf(p.name))) seen.push(actionOf(p.name))
    return seen
  }, [permissions])

  const original = existing
    ? { label: existing.label, name: existing.name, description: existing.description, color: existing.color, perms: [...existing.permissions].sort().join() }
    : null
  const changes = original
    ? [
        original.label !== label.trim(),
        original.name !== slug,
        original.description !== description.trim(),
        original.color !== color,
        !isSuper && original.perms !== [...perms].sort().join(),
      ].filter(Boolean).length
    : 1

  const has = (n: string) => perms.includes(n)
  const toggle = (n: string) => !isSuper && setPerms((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]))
  const setMany = (names: string[], on: boolean) =>
    !isSuper && setPerms((p) => (on ? [...new Set([...p, ...names])] : p.filter((x) => !names.includes(x))))

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !slug || taken) return
    const next: Role = {
      id: existing?.id ?? makeId('role'),
      name: locked ? existing!.name : slug,
      label: label.trim(),
      description: description.trim(),
      color,
      permissions: isSuper ? existing!.permissions : perms,
      system: existing?.system ?? false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    setRoles((prev) => (isNew ? [...prev, next] : prev.map((r) => (r.id === next.id ? next : r))))
    notify(isNew ? `Created “${next.label}”` : `Saved “${next.label}”`, 'success')
    navigate('/admin/access/roles')
  }

  if (id && !existing) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="font-display text-lg font-bold text-ink">This role doesn’t exist</p>
        <Link to="/admin/access/roles" className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
          Back to roles
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="space-y-4 pb-24">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/admin/access/roles" className="inline-flex items-center gap-1.5 text-caption font-semibold text-ink-mute hover:text-accent">
            <LuArrowLeft className="h-3.5 w-3.5" />
            All roles
          </Link>
          <h1 className="mt-2 flex items-center gap-2.5 font-display! text-2xl font-extrabold! tracking-[-0.03em]! text-ink">
            {isNew ? 'New role' : label || existing?.label}
            {existing && <RoleChip role={existing} name={existing.name} />}
          </h1>
          <p className="mt-1 text-sm text-ink-mute">
            {isSuper
              ? 'Super admin always has every permission. You can change its label, description and colour.'
              : 'Choose what people with this role can see and do.'}
          </p>
        </div>
        {existing && (
          <Link
            to="/admin/access/users"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-caption font-semibold text-ink transition-colors hover:border-accent/50!"
          >
            <LuUsers className="h-3.5 w-3.5" />
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </Link>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[22rem_1fr] xl:items-start">
        {/* details */}
        <Panel title="Details" className="xl:sticky xl:top-4">
          <div className="space-y-4">
            <Field label="Role name" required>
              {(fid) => (
                <Input id={fid} required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Warehouse" />
              )}
            </Field>
            <Field
              label="System name"
              hint={locked ? 'Built-in roles keep their system name.' : 'Used in code and the API. Lowercase, dashes only.'}
              error={taken ? 'Another role already uses this name.' : undefined}
            >
              {(fid) => (
                <div className="relative">
                  <Input
                    id={fid}
                    value={slug}
                    disabled={locked}
                    onChange={(e) => {
                      setNameTouched(true)
                      setName(e.target.value)
                    }}
                    className="pr-9! font-mono text-caption"
                  />
                  {locked && <LuLock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-mute" />}
                </div>
              )}
            </Field>
            <Field label="Description">
              {(fid) => (
                <Textarea id={fid} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this role for?" />
              )}
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Colour</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Colour">
                {ROLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={color === c}
                    aria-label={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-shadow',
                      roleDotTone[c],
                      color === c ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-border-strong',
                    )}
                  >
                    {color === c && <LuCheck className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <CoverageBar value={perms.length} total={permissions.length} className="border-t border-border pt-4" />
          </div>
        </Panel>

        {/* permissions */}
        <Panel
          title="Permissions"
          subtitle={isSuper ? 'Locked: super admin can do everything' : 'Tick an action, or switch a whole module on or off'}
          aside={
            !isSuper && (
              <div className="flex flex-wrap gap-1.5">
                <QuickButton onClick={() => setPerms(permissions.filter((p) => actionOf(p.name) === 'view').map((p) => p.name))}>
                  <LuEye className="h-3.5 w-3.5" />
                  View only
                </QuickButton>
                <QuickButton onClick={() => setPerms(permissions.map((p) => p.name))}>Select all</QuickButton>
                <QuickButton onClick={() => setPerms([])}>Clear</QuickButton>
              </div>
            )
          }
        >
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-mute">
                  <th className="sticky left-0 bg-surface px-5 py-2.5">Module</th>
                  {actions.map((a) => (
                    <th key={a} className="px-2 py-2.5 text-center">
                      {actionLabel(`x.${a}`)}
                    </th>
                  ))}
                  <th className="px-5 py-2.5 text-right">All</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(([group, list]) => {
                  const names = list.map((p) => p.name)
                  const onCount = names.filter(has).length
                  const allOn = onCount === names.length
                  return (
                    <tr key={group} className={cn('transition-colors', onCount ? 'bg-accent-soft/25' : 'hover:bg-surface-sunken/40')}>
                      <td className="sticky left-0 border-t border-border bg-inherit px-5 py-3">
                        <span className="block font-semibold text-ink">{group}</span>
                        <span className="block text-caption text-ink-mute tabular-nums">
                          {onCount} of {names.length}
                        </span>
                      </td>
                      {actions.map((a) => {
                        const p = list.find((x) => actionOf(x.name) === a)
                        return (
                          <td key={a} className="border-t border-border px-2 py-3 text-center">
                            {p ? (
                              <CheckCell on={has(p.name)} disabled={isSuper} label={p.label} onClick={() => toggle(p.name)} />
                            ) : (
                              <span className="text-border-strong">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="border-t border-border px-5 py-3">
                        <div className="flex justify-end">
                          <Switch checked={allOn} disabled={isSuper} onChange={(v) => setMany(names, v)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* sticky save bar */}
      <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:pl-72">
        <div className="flex w-full max-w-2xl items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-bg shadow-[0_18px_40px_rgba(11,10,16,0.3)]">
          <span className="flex items-center gap-2 text-sm">
            <LuShieldCheck className="h-4 w-4 text-[#c4b5fd]" />
            {isNew ? 'New role' : changes ? `${changes} unsaved change${changes === 1 ? '' : 's'}` : 'All changes saved'}
            <span className="hidden text-bg/60 sm:inline">· {perms.length} permissions</span>
          </span>
          <span className="flex gap-2">
            <Link to="/admin/access/roles" className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold text-bg/80 hover:text-bg">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!label.trim() || !slug || taken || (!isNew && !changes)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              <LuCheck className="h-4 w-4" />
              {isNew ? 'Create role' : 'Save role'}
            </button>
          </span>
        </div>
      </div>
    </form>
  )
}

function QuickButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-caption font-semibold text-ink-soft transition-colors hover:border-accent/50! hover:text-ink"
    >
      {children}
    </button>
  )
}

/** Big tappable tick used in permission grids. */
export function CheckCell({
  on,
  disabled,
  label,
  onClick,
}: {
  on: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'mx-auto flex h-7 w-7 items-center justify-center rounded-lg border transition-[background-color,border-color,transform] active:scale-90 disabled:cursor-not-allowed',
        on
          ? 'border-accent! bg-accent text-on-accent shadow-[0_4px_10px_rgba(109,40,217,0.25)]'
          : 'border-border-strong bg-surface text-transparent hover:border-accent! hover:text-accent/40',
        disabled && on && 'opacity-60',
      )}
    >
      <LuCheck className="h-4 w-4" />
    </button>
  )
}
