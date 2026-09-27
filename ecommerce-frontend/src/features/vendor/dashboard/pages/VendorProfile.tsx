import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuExternalLink, LuImage, LuMapPin, LuScrollText, LuStore } from 'react-icons/lu'
import { PageHeader } from '@/features/admin/components/primitives'
import { Avatar, Button, Field, ImageUploader, Input, Textarea } from '@/shared/ui'
import { StarIcon } from '@/shared/ui/icons'
import { useToast } from '@/shared/ui/Toast'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useVendors } from '../../context/VendorContext'

const BIO_MAX = 600

export function VendorProfile() {
  const vendor = useCurrentVendor()
  const { updateVendor } = useVendors()
  const { notify } = useToast()

  const [form, setForm] = useState(() => ({
    tagline: vendor?.tagline ?? '',
    bio: vendor?.bio ?? '',
    location: vendor?.location ?? '',
    logo: vendor?.logo ?? '',
    banner: vendor?.banner ?? '',
    shipping: vendor?.policies.shipping ?? '',
    returns: vendor?.policies.returns ?? '',
  }))

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const dirty =
    form.tagline !== vendor.tagline ||
    form.bio !== vendor.bio ||
    form.location !== vendor.location ||
    form.logo !== vendor.logo ||
    form.banner !== vendor.banner ||
    form.shipping !== vendor.policies.shipping ||
    form.returns !== vendor.policies.returns

  const submit = (e: FormEvent) => {
    e.preventDefault()
    updateVendor(vendor.id, {
      tagline: form.tagline,
      bio: form.bio,
      location: form.location,
      logo: form.logo,
      banner: form.banner,
      policies: { shipping: form.shipping, returns: form.returns },
    })
    notify('Storefront updated', 'success')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Storefront"
        description="This is what customers see on your maker page."
        action={
          <Link
            to={`/vendor/${vendor.slug}`}
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50!"
          >
            <LuExternalLink className="h-4 w-4" />
            View storefront
          </Link>
        }
      />

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
        {/* main column */}
        <div className="space-y-4">
          <Section icon={<LuStore className="h-4 w-4" />} title="Shop details">
            <div className="grid gap-4">
              <Field label="Tagline" required hint="One line — shown under your name everywhere">
                {(id) => <Input id={id} required maxLength={90} value={form.tagline} onChange={set('tagline')} />}
              </Field>
              <Field label="Location" required hint="City, country">
                {(id) => <Input id={id} required value={form.location} onChange={set('location')} placeholder="Copenhagen, DK" />}
              </Field>
              <Field label="About the shop" required>
                {(id) => (
                  <div>
                    <Textarea id={id} required rows={5} maxLength={BIO_MAX} value={form.bio} onChange={set('bio')} />
                    <p className="mt-1 text-right text-caption text-ink-mute tabular-nums">
                      {form.bio.length}/{BIO_MAX}
                    </p>
                  </div>
                )}
              </Field>
            </div>
          </Section>

          <Section icon={<LuImage className="h-4 w-4" />} title="Brand images" subtitle="Square logo, wide banner (about 16:6).">
            <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
              <div className="min-w-0 max-w-48">
                <p className="mb-1.5 text-sm font-semibold text-ink">Logo</p>
                <ImageUploader
                  max={1}
                  value={form.logo ? [form.logo] : []}
                  onChange={(next) => setForm((prev) => ({ ...prev, logo: next[0] ?? '' }))}
                />
              </div>
              <div className="min-w-0">
                <p className="mb-1.5 text-sm font-semibold text-ink">Banner</p>
                <ImageUploader
                  max={1}
                  aspect="aspect-[16/6]"
                  value={form.banner ? [form.banner] : []}
                  onChange={(next) => setForm((prev) => ({ ...prev, banner: next[0] ?? '' }))}
                />
              </div>
            </div>
          </Section>

          <Section icon={<LuScrollText className="h-4 w-4" />} title="Policies" subtitle="Shown on every product page from your shop.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Shipping policy" required>
                {(id) => <Textarea id={id} required rows={3} value={form.shipping} onChange={set('shipping')} />}
              </Field>
              <Field label="Returns policy" required>
                {(id) => <Textarea id={id} required rows={3} value={form.returns} onChange={set('returns')} />}
              </Field>
            </div>
          </Section>
        </div>

        {/* preview + save */}
        <div className="space-y-4 xl:sticky xl:top-6">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Live preview</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="relative h-28 bg-accent-soft">
                {form.banner && <img src={form.banner} alt="" className="h-full w-full object-cover" />}
                {form.location && (
                  <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm">
                    <LuMapPin className="h-3 w-3 text-accent" />
                    {form.location}
                  </span>
                )}
                <Avatar src={form.logo || undefined} name={vendor.name} size={48} className="absolute -bottom-6 left-4 ring-4 ring-surface" />
              </div>
              <div className="px-4 pb-4 pt-9">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-display text-lg font-bold tracking-[-0.01em] text-ink">{vendor.name}</p>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-caption font-semibold text-ink">
                    <StarIcon className="h-3 w-3 fill-accent text-accent" />
                    {vendor.rating.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-caption leading-relaxed text-ink-soft">
                  {form.tagline || 'Your one-line tagline appears here.'}
                </p>
                <p className="mt-3 line-clamp-3 border-t border-border pt-3 text-caption leading-relaxed text-ink-mute">
                  {form.bio || 'Tell customers about your materials, process and who’s behind the shop.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-caption text-ink-mute">{dirty ? 'You have unsaved changes.' : 'Everything is saved.'}</p>
            <Button type="submit" fullWidth className="mt-3" disabled={!dirty}>
              Save storefront
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  children: ReactNode
}) {
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
