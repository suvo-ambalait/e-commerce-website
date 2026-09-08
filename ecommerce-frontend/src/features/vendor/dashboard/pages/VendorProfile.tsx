import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/features/admin/components/primitives'
import { Button, ButtonLink, Field, ImageUploader, Input, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useVendors } from '../../context/VendorContext'

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
    <div className="space-y-5">
      <PageHeader
        title="Storefront"
        description="This is what customers see on your maker page."
        action={
          <ButtonLink to={`/vendor/${vendor.slug}`} variant="secondary" size="sm">
            View storefront
          </ButtonLink>
        }
      />

      <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-lg border border-border bg-surface p-6">
        <Field label="Tagline" required>
          {(id) => <Input id={id} required value={form.tagline} onChange={set('tagline')} />}
        </Field>
        <Field label="Location" required>
          {(id) => <Input id={id} required value={form.location} onChange={set('location')} />}
        </Field>
        <Field label="About the studio" required>
          {(id) => <Textarea id={id} required rows={5} value={form.bio} onChange={set('bio')} />}
        </Field>
        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <div>
            <p className="mb-1.5 text-caption font-medium tracking-wide text-ink-soft">Logo</p>
            <div className="w-28">
              <ImageUploader
                max={1}
                value={form.logo ? [form.logo] : []}
                onChange={(next) => setForm((prev) => ({ ...prev, logo: next[0] ?? '' }))}
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-caption font-medium tracking-wide text-ink-soft">Banner</p>
            <ImageUploader
              max={1}
              aspect="aspect-[16/6]"
              value={form.banner ? [form.banner] : []}
              onChange={(next) => setForm((prev) => ({ ...prev, banner: next[0] ?? '' }))}
            />
          </div>
        </div>
        <Field label="Shipping policy" required>
          {(id) => <Textarea id={id} required rows={2} value={form.shipping} onChange={set('shipping')} />}
        </Field>
        <Field label="Returns policy" required>
          {(id) => <Textarea id={id} required rows={2} value={form.returns} onChange={set('returns')} />}
        </Field>
        <Button type="submit" className="justify-self-start">
          Save storefront
        </Button>
      </form>
    </div>
  )
}
