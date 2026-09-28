import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuLock, LuMail, LuMapPin, LuMonitor, LuMoon, LuPhone, LuSun, LuUser } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useTheme } from '@/shared/hooks/useTheme'
import { Button, Field, Input } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { AccountCard } from '../components/AccountLayout'
import { formatAddress, useCustomer } from '../lib/useCustomer'

const themes = [
  { value: 'light', label: 'Light', icon: LuSun },
  { value: 'dark', label: 'Dark', icon: LuMoon },
  { value: 'system', label: 'System', icon: LuMonitor },
] as const

export function AccountProfilePage() {
  useDocumentTitle('Profile & settings · AmbalaEshop')
  const { profile, updateProfile, address } = useCustomer()
  const { choice, setChoice } = useTheme()
  const { notify } = useToast()

  const [form, setForm] = useState({ name: profile.name, phone: profile.phone })
  const dirty = form.name !== profile.name || form.phone !== profile.phone

  const submit = (e: FormEvent) => {
    e.preventDefault()
    updateProfile({ name: form.name.trim(), phone: form.phone.trim() })
    notify('Profile saved', 'success')
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit}>
        <AccountCard title="Personal details" subtitle="Used to fill in checkout and to contact you about deliveries.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              {(id) => (
                <Affix icon={<LuUser className="h-4 w-4" />}>
                  <Input id={id} required autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="pl-10!" />
                </Affix>
              )}
            </Field>
            <Field label="Phone">
              {(id) => (
                <Affix icon={<LuPhone className="h-4 w-4" />}>
                  <Input
                    id={id}
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+880 1712 345678"
                    className="pl-10!"
                  />
                </Affix>
              )}
            </Field>
            <Field label="Email" hint="This is your sign-in email, so it can’t be changed here." className="sm:col-span-2">
              {(id) => (
                <Affix icon={<LuMail className="h-4 w-4" />} trailing={<LuLock className="h-3.5 w-3.5" />}>
                  <Input id={id} type="email" value={profile.email} disabled className="pl-10! pr-10!" />
                </Affix>
              )}
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
            {dirty && <span className="text-caption text-ink-mute">You have unsaved changes.</span>}
            <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setForm({ name: profile.name, phone: profile.phone })}>
              Cancel
            </Button>
            <Button type="submit" disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </AccountCard>
      </form>

      <AccountCard
        title="Default delivery address"
        subtitle="Filled in for you at checkout."
        aside={
          <Link to="/account/addresses" className="text-caption font-semibold text-accent hover:underline">
            Manage addresses
          </Link>
        }
      >
        {address ? (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-sunken/50 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <LuMapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-ink">{address.fullName}</p>
              <p className="mt-0.5 text-ink-soft">{formatAddress(address)}</p>
              {address.phone && <p className="mt-0.5 text-ink-mute">{address.phone}</p>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-mute">Your address is saved when you place your first order.</p>
        )}
      </AccountCard>

      <AccountCard title="Appearance" subtitle="Saved on this device straight away.">
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const active = choice === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setChoice(t.value)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-semibold transition-colors',
                  active
                    ? 'border-accent! bg-accent-soft text-accent ring-4 ring-accent/10'
                    : 'border-border-strong text-ink-soft hover:border-accent/50! hover:text-ink',
                )}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </AccountCard>
    </div>
  )
}

function Affix({ icon, trailing, children }: { icon: ReactNode; trailing?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">{icon}</span>
      {children}
      {trailing && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute">{trailing}</span>}
    </div>
  )
}
