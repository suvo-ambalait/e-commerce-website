import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  LuCalendar,
  LuExternalLink,
  LuMail,
  LuMonitor,
  LuMoon,
  LuPackage,
  LuPalette,
  LuPhone,
  LuStar,
  LuStore,
  LuSun,
  LuUser,
} from 'react-icons/lu'
import { PageHeader } from '@/features/admin/components/primitives'
import { Pill, type PillTone } from '@/features/admin/components/TableKit'
import { Avatar, Button, Field, Input } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { useTheme } from '@/shared/hooks/useTheme'
import { cn } from '@/shared/lib/cn'
import { formatDateLong } from '@/shared/lib/format'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import type { VendorStatus } from '@/shared/types'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useVendors } from '../../context/VendorContext'

const statusTone: Record<VendorStatus, PillTone> = { active: 'success', pending: 'warning', suspended: 'danger' }
const statusLabel: Record<VendorStatus, string> = {
  active: 'Live',
  pending: 'Awaiting review',
  suspended: 'Suspended',
}

const themes = [
  { value: 'light', label: 'Light', icon: LuSun },
  { value: 'dark', label: 'Dark', icon: LuMoon },
  { value: 'system', label: 'System', icon: LuMonitor },
] as const

export function VendorAccount() {
  const vendor = useCurrentVendor()
  const { updateVendor } = useVendors()
  const { products } = useCatalog()
  const { choice, setChoice } = useTheme()
  const { notify } = useToast()

  const [form, setForm] = useState(() => ({
    ownerName: vendor?.ownerName ?? '',
    ownerEmail: vendor?.ownerEmail ?? '',
    ownerPhone: vendor?.ownerPhone ?? '',
  }))

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const dirty =
    form.ownerName !== (vendor.ownerName ?? '') ||
    form.ownerEmail !== vendor.ownerEmail ||
    form.ownerPhone !== (vendor.ownerPhone ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    updateVendor(vendor.id, {
      ownerName: form.ownerName.trim(),
      ownerEmail: form.ownerEmail.trim(),
      ownerPhone: form.ownerPhone.trim(),
    })
    notify('Profile updated', 'success')
  }

  const listed = products.filter((p) => p.vendorId === vendor.id).length
  const displayName = form.ownerName.trim() || vendor.name

  return (
    <div className="space-y-4">
      <PageHeader title="Your profile" description="Your personal details as the shop owner, and how the dashboard looks." />

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        {/* main column */}
        <div className="space-y-4">
          <Section
            icon={<LuUser className="h-4 w-4" />}
            title="Owner details"
            subtitle="Only AmbalaEshop sees these. Customers see your shop details instead."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                {(id) => (
                  <Affix icon={<LuUser className="h-4 w-4" />}>
                    <Input id={id} autoComplete="name" value={form.ownerName} onChange={set('ownerName')} placeholder="e.g. Abdur Rahman" className="pl-10!" />
                  </Affix>
                )}
              </Field>
              <Field label="Email" required hint="We send order and payout updates here">
                {(id) => (
                  <Affix icon={<LuMail className="h-4 w-4" />}>
                    <Input id={id} type="email" required autoComplete="email" value={form.ownerEmail} onChange={set('ownerEmail')} className="pl-10!" />
                  </Affix>
                )}
              </Field>
              <Field label="Phone" hint="For urgent questions about an order">
                {(id) => (
                  <Affix icon={<LuPhone className="h-4 w-4" />}>
                    <Input id={id} type="tel" autoComplete="tel" value={form.ownerPhone} onChange={set('ownerPhone')} placeholder="+880 1712 345678" className="pl-10!" />
                  </Affix>
                )}
              </Field>
            </div>
          </Section>

          <Section icon={<LuPalette className="h-4 w-4" />} title="Appearance" subtitle="Applies across the dashboard and storefront on this device. Saved straight away.">
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
          </Section>
        </div>

        {/* profile card + save */}
        <div className="space-y-4 xl:sticky xl:top-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="relative h-24 bg-linear-to-br from-[#6d28d9] to-[#a78bfa]">
              {vendor.banner && <img src={vendor.banner} alt="" className="h-full w-full object-cover opacity-90" />}
              <span className="absolute right-2.5 top-2.5">
                <Pill tone={statusTone[vendor.status]} dot>
                  {statusLabel[vendor.status]}
                </Pill>
              </span>
              <Avatar src={vendor.logo || undefined} name={vendor.name} size={56} className="absolute -bottom-7 left-4 ring-4 ring-surface" />
            </div>
            <div className="px-4 pb-4 pt-10">
              <p className="truncate font-display text-lg font-bold tracking-[-0.01em] text-ink">{displayName}</p>
              <p className="truncate text-caption text-ink-mute">Owner of {vendor.name}</p>

              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                <Stat icon={<LuPackage className="h-3.5 w-3.5" />} label="Products" value={String(listed)} />
                <Stat icon={<LuStar className="h-3.5 w-3.5" />} label="Rating" value={vendor.reviewCount ? vendor.rating.toFixed(1) : '—'} />
                <Stat icon={<LuCalendar className="h-3.5 w-3.5" />} label="Joined" value={new Date(vendor.joinedAt).getFullYear().toString()} />
              </dl>
              <p className="mt-3 text-center text-caption text-ink-mute">Member since {formatDateLong(vendor.joinedAt)}</p>

              <div className="mt-4 grid gap-2">
                <Link
                  to="/vendor/dashboard/profile"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-ink transition-colors hover:border-accent/50! hover:text-accent"
                >
                  <LuStore className="h-4 w-4" />
                  Edit storefront
                </Link>
                <Link
                  to={`/vendor/${vendor.slug}`}
                  target="_blank"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
                >
                  <LuExternalLink className="h-4 w-4" />
                  View your shop
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-caption text-ink-mute">{dirty ? 'You have unsaved changes.' : 'Everything is saved.'}</p>
            <Button type="submit" fullWidth className="mt-3" disabled={!dirty}>
              Save profile
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Section({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
        <div>
          <h3 className="font-display! text-base font-bold! tracking-[-0.01em]! text-ink">{title}</h3>
          {subtitle && <p className="text-caption text-ink-mute">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Affix({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">{icon}</span>
      {children}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    // dt must come first in the markup; flex-col-reverse puts the value on top visually
    <div className="flex flex-col-reverse">
      <dt className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-ink-mute">
        <span className="text-accent">{icon}</span>
        {label}
      </dt>
      <dd className="font-display text-base font-bold text-ink tabular-nums">{value}</dd>
    </div>
  )
}
