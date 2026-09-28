import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuCircleCheck, LuClock, LuMail, LuMapPin, LuMessageCircle, LuPhone, LuSend } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container, Field, Input, PageHeader, Section, Select, Textarea } from '@/shared/ui'
import { makeId } from '@/shared/lib/createStore'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { contentStore, messagesStore } from '@/features/marketplace/stores'

const topics = ['An order I placed', 'Returns & refunds', 'Payment', 'Selling on AmbalaEshop', 'Something else']

export function ContactPage() {
  useDocumentTitle('Contact · AmbalaEshop')
  const { settings } = useSettings()
  const [content] = contentStore.useStore()
  const [, setMessages] = messagesStore.useStore()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: topics[0], orderNumber: '', message: '' })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setMessages((prev) => [{ id: makeId('msg'), ...form, createdAt: new Date().toISOString(), read: false }, ...prev])
    setSent(true)
  }

  const whatsapp = content.contact.whatsapp.replace(/\D/g, '')

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        <PageHeader
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
          eyebrow="We’re here to help"
          title={
            <>
              Get in <em>touch</em>
            </>
          }
          description="Questions about an order, a return or selling with us? Send a message and we’ll reply within one working day."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
                  <LuCircleCheck className="h-7 w-7" />
                </span>
                <p className="mt-4 font-display text-xl font-bold text-ink">Message sent</p>
                <p className="mt-1 max-w-sm text-sm text-ink-soft">
                  Thanks, {form.name.split(' ')[0] || 'there'}. We’ll reply to {form.email} within one working day.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false)
                    setForm((f) => ({ ...f, message: '', orderNumber: '' }))
                  }}
                  className="mt-5 text-sm font-semibold text-accent hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name" required>
                    {(id) => <Input id={id} required autoComplete="name" value={form.name} onChange={set('name')} />}
                  </Field>
                  <Field label="Phone">
                    {(id) => <Input id={id} type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+880 1712 345678" />}
                  </Field>
                </div>
                <Field label="Email" required>
                  {(id) => <Input id={id} required type="email" autoComplete="email" value={form.email} onChange={set('email')} />}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Topic" required>
                    {(id) => (
                      <Select id={id} value={form.topic} onChange={(v) => setForm((f) => ({ ...f, topic: v }))} options={topics.map((t) => ({ value: t, label: t }))} />
                    )}
                  </Field>
                  <Field label="Order number" hint="If it’s about an order">
                    {(id) => <Input id={id} value={form.orderNumber} onChange={set('orderNumber')} placeholder="MSN-123456" />}
                  </Field>
                </div>
                <Field label="Message" required>
                  {(id) => <Textarea id={id} required rows={6} value={form.message} onChange={set('message')} />}
                </Field>
                <div>
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent shadow-[0_10px_28px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover"
                  >
                    <LuSend className="h-4 w-4" />
                    Send message
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Contact details</p>
              <ul className="space-y-3.5 text-sm">
                <Item icon={<LuMail className="h-4 w-4" />} label="Email">
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-accent">
                    {settings.contactEmail}
                  </a>
                </Item>
                {settings.contactPhone && (
                  <Item icon={<LuPhone className="h-4 w-4" />} label="Phone">
                    <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="hover:text-accent">
                      {settings.contactPhone}
                    </a>
                  </Item>
                )}
                {whatsapp && (
                  <Item icon={<LuMessageCircle className="h-4 w-4" />} label="WhatsApp">
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-accent">
                      Chat with us
                    </a>
                  </Item>
                )}
                <Item icon={<LuClock className="h-4 w-4" />} label="Hours">
                  {content.contact.hours}
                </Item>
                {settings.contactAddress && (
                  <Item icon={<LuMapPin className="h-4 w-4" />} label="Office">
                    {settings.contactAddress}
                  </Item>
                )}
              </ul>
            </div>

            <div className="rounded-2xl bg-[#0b0a10] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a78bfa]">Quick answers</p>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  { to: '/track-order', label: 'Track an order' },
                  { to: '/shipping-returns', label: 'Shipping & returns' },
                  { to: '/faq', label: 'Frequently asked questions' },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-[#d4cfe3] transition-colors hover:text-white">
                      → {l.label}
                    </Link>
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

function Item({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
      <span className="min-w-0">
        <span className="block text-caption text-ink-mute">{label}</span>
        <span className="block wrap-break-word text-ink">{children}</span>
      </span>
    </li>
  )
}
