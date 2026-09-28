import { useState, type FormEvent } from 'react'
import { LuBan, LuCheck, LuMail, LuShieldCheck, LuTrash2, LuUserPlus } from 'react-icons/lu'
import { PageHeader, Panel, DataTable, type Column } from '../components/primitives'
import { Pill } from '../components/TableKit'
import { Avatar, Button, Field, Input, Modal, Select } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { formatDate } from '@/shared/lib/format'
import { makeId } from '@/shared/lib/createStore'
import { staffPermissions, staffStore, type StaffMember, type StaffRole } from '@/features/marketplace/stores'
import { staffStatusTone } from '@/features/marketplace/labels'

const roles = Object.keys(staffPermissions) as StaffRole[]
const assignable = roles.filter((r) => r !== 'Owner')

export function AdminStaff() {
  const [staff, setStaff] = staffStore.useStore()
  const { notify } = useToast()
  const [inviting, setInviting] = useState(false)
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Manager')

  const update = (id: string, patch: Partial<StaffMember>) => setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const columns: Column<StaffMember>[] = [
    {
      header: 'Person',
      id: 'person',
      sortValue: (s) => s.name,
      cell: (s) => (
        <span className="flex items-center gap-3">
          <Avatar name={s.name} size={34} />
          <span className="min-w-0">
            <span className="block max-w-48 truncate font-display font-bold text-ink">{s.name}</span>
            <span className="block max-w-48 truncate text-[11px] text-ink-mute">{s.email}</span>
          </span>
        </span>
      ),
    },
    {
      header: 'Role',
      id: 'role',
      sortValue: (s) => s.role,
      cell: (s) =>
        s.role === 'Owner' ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <LuShieldCheck className="h-4 w-4 text-accent" />
            Owner
          </span>
        ) : (
          <div className="w-40">
            <Select
              value={s.role}
              onChange={(v) => {
                update(s.id, { role: v as StaffRole })
                notify(`${s.name} is now ${v}`, 'success')
              }}
              options={assignable.map((r) => ({ value: r, label: r }))}
            />
          </div>
        ),
    },
    {
      header: 'Status',
      id: 'status',
      hideBelow: 'sm',
      sortValue: (s) => s.status,
      cell: (s) => (
        <Pill tone={staffStatusTone[s.status]} dot>
          {s.status}
        </Pill>
      ),
    },
    {
      header: 'Added',
      id: 'added',
      hideBelow: 'md',
      sortValue: (s) => s.addedAt,
      cell: (s) => <span className="whitespace-nowrap text-ink-mute">{formatDate(s.addedAt)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff & roles"
        description={`${staff.length} people can sign in to this admin. Each role only sees what it needs.`}
        action={
          <Button onClick={() => setInviting(true)}>
            <LuUserPlus className="h-4 w-4" />
            Invite staff
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        <DataTable
          rows={staff}
          columns={columns}
          keyOf={(s) => s.id}
          empty="No staff yet."
          defaultSort={{ id: 'person', dir: 'asc' }}
          rowActions={[
            { label: 'Resend invite', icon: LuMail, onClick: (s) => notify(`Invite sent again to ${s.email}`), hidden: (s) => s.status !== 'Invited' },
            { label: 'Suspend', icon: LuBan, onClick: (s) => update(s.id, { status: 'Suspended' }), hidden: (s) => s.role === 'Owner' || s.status === 'Suspended' },
            { label: 'Reactivate', icon: LuCheck, onClick: (s) => update(s.id, { status: 'Active' }), hidden: (s) => s.status !== 'Suspended' },
            {
              label: 'Remove',
              icon: LuTrash2,
              danger: true,
              hidden: (s) => s.role === 'Owner',
              onClick: (s) => {
                if (confirm(`Remove ${s.name}? They lose access straight away.`)) setStaff((prev) => prev.filter((x) => x.id !== s.id))
              },
            },
          ]}
        />

        <Panel title="What each role can do" subtitle="Pick a role to see its access">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                aria-pressed={selectedRole === r}
                className={cn(
                  'h-8 rounded-full px-3 text-caption font-semibold transition-colors',
                  selectedRole === r ? 'bg-ink text-bg' : 'bg-surface-sunken text-ink-soft hover:text-ink',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {staffPermissions[selectedRole].map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-ink-soft">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-soft text-success">
                  <LuCheck className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-caption text-ink-mute">
            {staff.filter((s) => s.role === selectedRole).length} {staff.filter((s) => s.role === selectedRole).length === 1 ? 'person has' : 'people have'} this role.
          </p>
        </Panel>
      </div>

      {inviting && (
        <InviteModal
          taken={staff.map((s) => s.email.toLowerCase())}
          onClose={() => setInviting(false)}
          onInvite={(m) => {
            setStaff((prev) => [...prev, m])
            setInviting(false)
            notify(`Invite sent to ${m.email}`, 'success')
          }}
        />
      )}
    </div>
  )
}

function InviteModal({ taken, onClose, onInvite }: { taken: string[]; onClose: () => void; onInvite: (m: StaffMember) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole>('Support')
  const duplicate = taken.includes(email.trim().toLowerCase())

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (duplicate) return
    onInvite({ id: makeId('st'), name: name.trim(), email: email.trim().toLowerCase(), role, status: 'Invited', addedAt: new Date().toISOString() })
  }

  return (
    <Modal open onClose={onClose} title="Invite staff">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          {(id) => <Input id={id} required value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Work email" required error={duplicate ? 'This person already has access.' : undefined}>
          {(id) => <Input id={id} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Role</p>
          <div className="grid gap-2">
            {assignable.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={role === r}
                onClick={() => setRole(r)}
                className={cn(
                  'rounded-xl border px-3.5 py-2.5 text-left transition-colors',
                  role === r ? 'border-accent! bg-accent-soft/60' : 'border-border-strong hover:border-accent/50!',
                )}
              >
                <span className="block text-sm font-semibold text-ink">{r}</span>
                <span className="block text-caption text-ink-mute">{staffPermissions[r].join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={duplicate}>
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  )
}
