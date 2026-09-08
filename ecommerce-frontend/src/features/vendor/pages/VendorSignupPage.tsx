import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, Container, Field, Input, Section, Textarea } from '@/shared/ui'
import { useVendors } from '../context/VendorContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/ui/Toast'

export function VendorSignupPage() {
  useDocumentTitle('Sell on MorerDokan')
  const navigate = useNavigate()
  const { registerVendor } = useVendors()
  const { signup } = useAuth()
  const { notify } = useToast()

  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    location: '',
    tagline: '',
    bio: '',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const vendor = registerVendor({
      name: form.name,
      tagline: form.tagline,
      bio: form.bio,
      location: form.location,
      ownerEmail: form.ownerEmail,
    })
    signup(form.ownerName, form.ownerEmail, 'demo', 'vendor', vendor.id)
    notify('Application received — you can set up your storefront now', 'success')
    navigate('/vendor/dashboard')
  }

  return (
    <Section size="sm">
      <Container size="narrow">
        <p className="text-caption font-medium uppercase tracking-[0.16em] text-accent">Apply to sell</p>
        <h1 className="mt-3 text-3xl text-ink">Open a studio on MorerDokan</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Tell us about your workshop. Your storefront goes live once a curator has reviewed it —
          usually within a week. In the meantime you can add products and set up payouts.
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-5 rounded-lg border border-border bg-surface p-6 sm:p-8">
          <Field label="Studio name" required>
            {(id) => <Input id={id} required value={form.name} onChange={set('name')} placeholder="e.g. Halden Woodworks" />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name" required>
              {(id) => <Input id={id} required value={form.ownerName} onChange={set('ownerName')} />}
            </Field>
            <Field label="Email" required>
              {(id) => <Input id={id} type="email" required value={form.ownerEmail} onChange={set('ownerEmail')} />}
            </Field>
          </div>
          <Field label="Location" required hint="City, country — shown on your storefront">
            {(id) => <Input id={id} required value={form.location} onChange={set('location')} placeholder="Oslo, NO" />}
          </Field>
          <Field label="One-line tagline" required>
            {(id) => (
              <Input id={id} required value={form.tagline} onChange={set('tagline')} placeholder="What you make, in a sentence" />
            )}
          </Field>
          <Field label="About the studio" required>
            {(id) => (
              <Textarea
                id={id}
                required
                rows={5}
                value={form.bio}
                onChange={set('bio')}
                placeholder="Materials, process, who’s behind it."
              />
            )}
          </Field>
          <Button type="submit" size="lg" className="justify-self-start">
            Submit application
          </Button>
        </form>
      </Container>
    </Section>
  )
}
