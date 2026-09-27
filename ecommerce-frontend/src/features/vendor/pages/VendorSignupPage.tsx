import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuMapPin, LuPenLine, LuStore, LuUser } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container, PageHeader, Section } from '@/shared/ui'
import { ArrowRightIcon, CheckIcon, MailIcon, StarIcon } from '@/shared/ui/icons'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { useVendors } from '../context/VendorContext'
import { useToast } from '@/shared/ui/Toast'

const BIO_MAX = 600

export function VendorSignupPage() {
  useDocumentTitle('Sell on MorerDokan')
  const navigate = useNavigate()
  const { registerVendor } = useVendors()
  const { notify } = useToast()
  const { settings } = useSettings()

  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    location: '',
    tagline: '',
    bio: '',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    registerVendor({
      name: form.name,
      tagline: form.tagline,
      bio: form.bio,
      location: form.location,
      ownerEmail: form.ownerEmail,
      ownerPhone: form.ownerPhone,
    })
    notify('Application received — you can set up your storefront now', 'success')
    navigate('/vendor/dashboard')
  }

  const steps = [
    { title: 'Apply', text: 'Tell us about your workshop — takes about five minutes.' },
    { title: 'Curator review', text: 'We check materials, making and repairability. Usually within a week.' },
    { title: 'Go live', text: 'Add products and payouts while you wait; your storefront opens once approved.' },
  ]

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        <PageHeader
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Makers', to: '/vendors' }, { label: 'Apply to sell' }]}
          eyebrow="Apply to sell"
          title={
            <>
              Open a studio <em>on MorerDokan</em>
            </>
          }
          description="Tell us about your workshop. Your storefront goes live once a curator has reviewed it — usually within a week. In the meantime you can add products and set up payouts."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          {/* form */}
          <form onSubmit={submit} className="space-y-5">
            <Panel icon={<LuStore className="h-4 w-4" />} title="Your Shop Details">
              <div className="grid gap-4">
                <BoxInput
                  label="Shop name"
                  icon={<LuStore className="h-4 w-4" />}
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Halden Woodworks"
                />
                <BoxInput
                  label="Email"
                  icon={<LuStore className="h-4 w-4" />}
                  required
                  value={form.ownerEmail}
                  onChange={set('ownerEmail')}
                  placeholder="e.g. halden@woodworks.com"
                />
                <BoxInput
                  label="Phone number"
                  icon={<LuStore className="h-4 w-4" />}
                  required
                  value={form.ownerPhone}
                  onChange={set('ownerPhone')}
                  placeholder="e.g. +47 987 65 432"
                />
                <BoxInput
                  label="Shop name"
                  icon={<LuStore className="h-4 w-4" />}
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Halden Woodworks"
                />
                <BoxInput
                  label="Address / location"
                  hint="City, country — shown on your storefront"
                  icon={<LuMapPin className="h-4 w-4" />}
                  required
                  value={form.location}
                  onChange={set('location')}
                  placeholder="Oslo, NO"
                />

                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      About the shop / Description <span className="text-accent">*</span>
                    </span>
                    <span className="text-caption text-ink-mute tabular-nums">
                      {form.bio.length}/{BIO_MAX}
                    </span>
                  </span>
                  <textarea
                    required
                    rows={5}
                    maxLength={BIO_MAX}
                    value={form.bio}
                    onChange={set('bio')}
                    placeholder="Materials, process, who’s behind it."
                    className="w-full resize-none rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-mute focus:border-accent! focus:ring-4 focus:ring-accent/15"
                  />
                </label>
              </div>
            </Panel>



            {/* <Panel icon={<LuUser className="h-4 w-4" />} title="About you">
              <div className="grid gap-4 sm:grid-cols-2">
                <BoxInput
                  label="Your name"
                  icon={<LuUser className="h-4 w-4" />}
                  required
                  autoComplete="name"
                  value={form.ownerName}
                  onChange={set('ownerName')}
                  placeholder="Full name"
                />
                <BoxInput
                  label="Email"
                  icon={<MailIcon className="h-4 w-4" />}
                  type="email"
                  required
                  autoComplete="email"
                  value={form.ownerEmail}
                  onChange={set('ownerEmail')}
                  placeholder="you@studio.com"
                />
              </div>
            </Panel> */}

            <button
              type="submit"
              className="group inline-flex h-13 items-center gap-3 rounded-full bg-accent pl-6 pr-1.5 text-sm font-semibold text-on-accent shadow-[0_10px_28px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover"
            >
              Submit application
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6d28d9]">
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </form>

          {/* sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-28">
            {/* live preview */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Live preview</p>
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="relative h-24 bg-linear-to-br from-[#6d28d9] to-[#a78bfa]">
                  {form.location && (
                    <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm">
                      <LuMapPin className="h-3 w-3 text-accent" />
                      {form.location}
                    </span>
                  )}
                  <span className="absolute -bottom-6 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-bg ring-4 ring-surface">
                    {initials(form.name) || <LuStore className="h-5 w-5" />}
                  </span>
                </div>
                <div className="px-4 pb-4 pt-9">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-display text-lg font-bold tracking-[-0.01em] text-ink">
                      {form.name || 'Your studio name'}
                    </p>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-caption font-semibold text-ink">
                      <StarIcon className="h-3 w-3 fill-accent text-accent" />
                      New
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-caption leading-relaxed text-ink-soft">
                    {form.tagline || 'Your one-line tagline appears here.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-caption">
                    <span className="text-ink-mute">0 pieces</span>
                    <span className="flex items-center gap-1 font-semibold text-accent">
                      Visit studio
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* how it works — fixed dark colours in both themes */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0b0a10] p-6 text-white ring-1 ring-transparent dark:ring-white/10">
              <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full border border-white/10!" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a78bfa]">How it works</p>
              <ol className="relative mt-4 space-y-4">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6d28d9] text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{s.title}</span>
                      <span className="mt-0.5 block text-caption leading-relaxed text-[#b8b3c7]">{s.text}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <ul className="relative mt-6 space-y-2 border-t border-white/10! pt-5 text-sm">
                {[
                  `${Math.round(settings.commissionRate * 100)}% flat commission — you set your prices`,
                  'Weekly payouts to your bank',
                  'Your name on every piece and receipt',
                ].map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-[#d4cfe3]">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#6d28d9]/40 text-[#c4b5fd]">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
        <h2 className="font-display! text-lg font-bold! tracking-[-0.01em]! text-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function BoxInput({
  label,
  hint,
  icon,
  ...input
}: {
  label: string
  hint?: string
  icon: ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {input.required && <span className="text-accent"> *</span>}
      </span>
      <span className="flex h-12 items-center gap-2.5 rounded-xl border border-border-strong bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent! focus-within:ring-4 focus-within:ring-accent/15">
        <span className="shrink-0 text-ink-mute">{icon}</span>
        <input
          {...input}
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-ink-mute focus:ring-0"
        />
      </span>
      {hint && <span className="mt-1 block text-caption text-ink-mute">{hint}</span>}
    </label>
  )
}
