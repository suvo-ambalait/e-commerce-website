import { useState, type FormEvent } from 'react'
import { PageHeader } from '../components/primitives'
import { Avatar, Badge, Button, ButtonLink, Field, Input } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { useTheme } from '@/shared/hooks/useTheme'
import { useAuth } from '@/features/auth/context/AuthContext'

export function DashboardAccount() {
  const { user, updateProfile, logout } = useAuth()
  const { choice, setChoice } = useTheme()
  const { notify } = useToast()
  const [name, setName] = useState(user?.name ?? '')

  if (!user) return null

  const save = (e: FormEvent) => {
    e.preventDefault()
    updateProfile(name.trim() || user.name)
    notify('Profile updated', 'success')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Your profile" description="Applies across the dashboard and storefront." />

      <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
        <Avatar name={user.name} size={56} />
        <div>
          <p className="text-sm font-medium text-ink">{user.name}</p>
          <p className="text-caption text-ink-mute">{user.email}</p>
          <Badge tone={user.role === 'admin' ? 'inverse' : 'accent'} className="mt-1">
            {user.role}
          </Badge>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <Field label="Display name">
          {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Email" hint="Contact support to change your sign-in email">
          {(id) => <Input id={id} value={user.email} disabled />}
        </Field>
        <Button type="submit">Save changes</Button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm font-medium text-ink">Appearance</p>
        <div className="mt-3 flex gap-2">
          {(['light', 'dark', 'system'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setChoice(opt)}
              className={`rounded-full border px-4 py-1.5 text-caption capitalize transition-colors ${
                choice === opt ? 'border-transparent bg-ink text-bg' : 'border-border-strong text-ink-soft hover:border-ink'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <ButtonLink to="/" variant="secondary">
          Switch to storefront
        </ButtonLink>
        <Button variant="ghost" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
