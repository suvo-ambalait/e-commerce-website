import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowDown, LuArrowUp, LuExternalLink, LuImage, LuInbox, LuMail, LuMegaphone, LuPlus, LuRotateCcw, LuTrash2 } from 'react-icons/lu'
import { PageHeader, Panel } from '../components/primitives'
import { TableTabs } from '../components/TableKit'
import { Badge, Button, Field, ImageUploader, Input, Switch, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/cn'
import { formatDate } from '@/shared/lib/format'
import { makeId } from '@/shared/lib/createStore'
import { contentStore, defaultContent, messagesStore, type PolicySlug, type SiteContent } from '@/features/marketplace/stores'

type Tab = 'home' | 'pages' | 'contact' | 'messages'

const pageNames: Record<PolicySlug, string> = {
  'shipping-returns': 'Shipping & returns',
  faq: 'FAQ',
  terms: 'Terms of service',
  privacy: 'Privacy policy',
}

export function AdminContent() {
  const [saved, setSaved] = contentStore.useStore()
  const [messages] = messagesStore.useStore()
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('home')
  const [draft, setDraft] = useState<SiteContent>(saved)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const unread = messages.filter((m) => !m.read).length

  const save = () => {
    setSaved(draft)
    notify('Site content published', 'success')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Site content"
        description="Homepage banners, the announcement bar, help pages and messages from customers."
        action={
          tab !== 'messages' && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={!dirty} onClick={() => setDraft(saved)}>
                Discard
              </Button>
              <Button size="sm" disabled={!dirty} onClick={save}>
                Publish changes
              </Button>
            </div>
          )
        }
      />

      <TableTabs
        label="Content section"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'home', label: 'Homepage' },
          { value: 'pages', label: 'Help pages' },
          { value: 'contact', label: 'Contact details' },
          { value: 'messages', label: 'Messages', count: unread },
        ]}
      />

      {tab === 'home' && <HomeTab draft={draft} setDraft={setDraft} />}
      {tab === 'pages' && <PagesTab draft={draft} setDraft={setDraft} />}
      {tab === 'contact' && <ContactTab draft={draft} setDraft={setDraft} />}
      {tab === 'messages' && <MessagesTab />}

      {dirty && tab !== 'messages' && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-sm text-ink-soft">You have unpublished changes.</p>
          <Button size="sm" onClick={save}>
            Publish changes
          </Button>
        </div>
      )}
    </div>
  )
}

type TabProps = { draft: SiteContent; setDraft: React.Dispatch<React.SetStateAction<SiteContent>> }

function HomeTab({ draft, setDraft }: TabProps) {
  const setBanner = (id: string, patch: Partial<SiteContent['banners'][number]>) =>
    setDraft((d) => ({ ...d, banners: d.banners.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))

  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const next = [...d.banners]
      const j = i + dir
      if (j < 0 || j >= next.length) return d
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...d, banners: next }
    })

  return (
    <div className="space-y-4">
      <Panel title="Announcement bar" subtitle="The thin dark strip at the very top of every page">
        <div className="space-y-4">
          <Switch
            checked={draft.announcement.on}
            onChange={(on) => setDraft((d) => ({ ...d, announcement: { ...d.announcement, on } }))}
            label="Show my announcement instead of the free-shipping line"
          />
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Text" hint={`${draft.announcement.text.length}/80`}>
              {(id) => (
                <Input
                  id={id}
                  maxLength={80}
                  value={draft.announcement.text}
                  onChange={(e) => setDraft((d) => ({ ...d, announcement: { ...d.announcement, text: e.target.value } }))}
                />
              )}
            </Field>
            <Field label="Links to">
              {(id) => (
                <Input
                  id={id}
                  value={draft.announcement.link}
                  onChange={(e) => setDraft((d) => ({ ...d, announcement: { ...d.announcement, link: e.target.value } }))}
                  placeholder="/deals"
                />
              )}
            </Field>
          </div>
          <div className="flex h-9 items-center justify-center rounded-lg bg-[#0b0a10] px-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            <LuMegaphone className="mr-2 h-3.5 w-3.5 text-[#a78bfa]" />
            <span className="truncate">{draft.announcement.on && draft.announcement.text ? draft.announcement.text : 'Free shipping line (default)'}</span>
          </div>
        </div>
      </Panel>

      <Panel
        title="Homepage banners"
        subtitle="Shown under the hero. Two active banners sit side by side."
        aside={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setDraft((d) => ({ ...d, banners: [...d.banners, { id: makeId('b'), title: 'New banner', subtitle: '', image: '', link: '/shop', active: false }] }))
            }
          >
            <LuPlus className="h-4 w-4" />
            Add banner
          </Button>
        }
      >
        {draft.banners.length === 0 ? (
          <p className="text-sm text-ink-mute">No banners. The homepage goes straight from the hero to the value props.</p>
        ) : (
          <div className="space-y-4">
            {draft.banners.map((b, i) => (
              <div key={b.id} className={cn('rounded-2xl border p-4', b.active ? 'border-accent/50!' : 'border-border')}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <LuImage className="h-4 w-4 text-accent" />
                  <p className="flex-1 text-sm font-semibold text-ink">Banner {i + 1}</p>
                  {b.active ? <Badge tone="success">Live</Badge> : <Badge tone="neutral">Hidden</Badge>}
                  <Button variant="ghost" size="sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <LuArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Move down" disabled={i === draft.banners.length - 1} onClick={() => move(i, 1)}>
                    <LuArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Delete banner"
                    className="text-danger!"
                    onClick={() => setDraft((d) => ({ ...d, banners: d.banners.filter((x) => x.id !== b.id) }))}
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-[10rem_1fr]">
                  <ImageUploader max={1} value={b.image ? [b.image] : []} onChange={(next) => setBanner(b.id, { image: next[0] ?? '' })} />
                  <div className="grid gap-3">
                    <Field label="Headline">{(id) => <Input id={id} value={b.title} onChange={(e) => setBanner(b.id, { title: e.target.value })} />}</Field>
                    <Field label="Subtext">{(id) => <Input id={id} value={b.subtitle} onChange={(e) => setBanner(b.id, { subtitle: e.target.value })} />}</Field>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <Field label="Links to">{(id) => <Input id={id} value={b.link} onChange={(e) => setBanner(b.id, { link: e.target.value })} placeholder="/shop" />}</Field>
                      <Switch checked={b.active} onChange={(active) => setBanner(b.id, { active })} label="Show" className="h-11" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

function PagesTab({ draft, setDraft }: TabProps) {
  const [slug, setSlug] = useState<PolicySlug>('shipping-returns')
  const page = draft.pages[slug]
  const isFaq = slug === 'faq'

  const setPage = (patch: Partial<typeof page>) =>
    setDraft((d) => ({ ...d, pages: { ...d.pages, [slug]: { ...d.pages[slug], ...patch, updatedAt: new Date().toISOString() } } }))
  const setSection = (i: number, patch: Partial<(typeof page.sections)[number]>) =>
    setPage({ sections: page.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[14rem_1fr] lg:items-start">
      <nav className="rounded-2xl border border-border bg-surface p-2 shadow-sm">
        {(Object.keys(pageNames) as PolicySlug[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSlug(s)}
            className={cn(
              'flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
              s === slug ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
            )}
          >
            {pageNames[s]}
          </button>
        ))}
      </nav>

      <Panel
        title={pageNames[slug]}
        subtitle={`Last edited ${formatDate(page.updatedAt)}`}
        aside={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setDraft((d) => ({ ...d, pages: { ...d.pages, [slug]: defaultContent.pages[slug] } }))}>
              <LuRotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Link to={`/${slug}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-caption font-semibold text-accent hover:bg-accent-soft">
              <LuExternalLink className="h-3.5 w-3.5" />
              View
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Page title">{(id) => <Input id={id} value={page.title} onChange={(e) => setPage({ title: e.target.value })} />}</Field>
          <Field label="Introduction">{(id) => <Textarea id={id} rows={2} value={page.intro} onChange={(e) => setPage({ intro: e.target.value })} />}</Field>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-semibold text-ink">{isFaq ? 'Questions' : 'Sections'}</p>
            {page.sections.map((s, i) => (
              <div key={i} className="rounded-xl border border-border p-3.5">
                <div className="grid gap-3">
                  <div className="flex items-end gap-2">
                    <Field label={isFaq ? `Question ${i + 1}` : `Heading ${i + 1}`} className="flex-1">
                      {(id) => <Input id={id} value={s.heading} onChange={(e) => setSection(i, { heading: e.target.value })} />}
                    </Field>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Remove"
                      className="mb-1 text-danger!"
                      onClick={() => setPage({ sections: page.sections.filter((_, j) => j !== i) })}
                    >
                      <LuTrash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Field label={isFaq ? 'Answer' : 'Text'}>
                    {(id) => <Textarea id={id} rows={3} value={s.body} onChange={(e) => setSection(i, { body: e.target.value })} />}
                  </Field>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setPage({ sections: [...page.sections, { heading: '', body: '' }] })}>
              <LuPlus className="h-4 w-4" />
              {isFaq ? 'Add question' : 'Add section'}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function ContactTab({ draft, setDraft }: TabProps) {
  const set = (key: keyof SiteContent['contact']) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, contact: { ...d.contact, [key]: e.target.value } }))
  return (
    <Panel title="Contact page" subtitle="Email, phone and office address come from Settings">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Opening hours">{(id) => <Input id={id} value={draft.contact.hours} onChange={set('hours')} />}</Field>
        <Field label="WhatsApp number" hint="With country code, e.g. 8801712345678">
          {(id) => <Input id={id} inputMode="numeric" value={draft.contact.whatsapp} onChange={set('whatsapp')} />}
        </Field>
      </div>
      <Link to="/admin/settings" className="mt-4 inline-block text-caption font-semibold text-accent hover:underline">
        Edit email, phone and address in Settings →
      </Link>
    </Panel>
  )
}

function MessagesTab() {
  const [messages, setMessages] = messagesStore.useStore()
  const [openId, setOpenId] = useState<string | null>(messages[0]?.id ?? null)
  const open = messages.find((m) => m.id === openId)

  const select = (id: string) => {
    setOpenId(id)
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)))
  }

  if (messages.length === 0) {
    return (
      <Panel>
        <div className="flex flex-col items-center py-10 text-center">
          <LuInbox className="h-8 w-8 text-ink-mute" />
          <p className="mt-3 font-semibold text-ink">No messages yet</p>
          <p className="text-sm text-ink-mute">Messages sent from the Contact page land here.</p>
        </div>
      </Panel>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_1fr] lg:items-start">
      <ul className="max-h-[36rem] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-sm">
        {messages.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => select(m.id)}
              className={cn(
                'flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition-colors',
                m.id === openId ? 'bg-accent-soft' : 'hover:bg-surface-sunken',
              )}
            >
              <span className="flex items-center gap-2">
                {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                <span className={cn('flex-1 truncate text-sm text-ink', !m.read && 'font-semibold')}>{m.name}</span>
                <span className="text-[11px] text-ink-mute">{formatDate(m.createdAt)}</span>
              </span>
              <span className="truncate text-caption text-ink-mute">
                {m.topic} · {m.message}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <Panel
          title={open.topic}
          subtitle={`${open.name} · ${formatDate(open.createdAt)}`}
          aside={
            <a
              href={`mailto:${open.email}?subject=Re: ${open.topic}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-caption font-semibold text-on-accent hover:bg-accent-hover"
            >
              <LuMail className="h-3.5 w-3.5" />
              Reply
            </a>
          }
        >
          <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
            <Info label="Email">{open.email}</Info>
            <Info label="Phone">{open.phone || '—'}</Info>
            <Info label="Order">
              {open.orderNumber ? (
                <Link to={`/admin/orders/${open.orderNumber}`} className="text-accent hover:underline">
                  {open.orderNumber}
                </Link>
              ) : (
                '—'
              )}
            </Info>
          </dl>
          <p className="whitespace-pre-line rounded-xl bg-surface-sunken/70 p-4 text-sm leading-relaxed text-ink">{open.message}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-danger!"
            onClick={() => {
              setMessages((prev) => prev.filter((m) => m.id !== open.id))
              setOpenId(null)
            }}
          >
            <LuTrash2 className="h-3.5 w-3.5" />
            Delete message
          </Button>
        </Panel>
      )}
    </div>
  )
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-ink-mute">{label}</dt>
      <dd className="truncate text-ink">{children}</dd>
    </div>
  )
}
