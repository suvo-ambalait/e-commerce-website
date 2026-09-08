import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { Button, Input } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { SocialLinks } from './SocialLinks'
import { Logo } from './Logo'

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/shop' },
      { label: 'New this week', to: '/shop?sort=new' },
      { label: 'On sale', to: '/deals' },
      { label: 'Gift ideas', to: '/shop' },
    ],
  },
  {
    title: 'Makers',
    links: [
      { label: 'Directory', to: '/vendors' },
      { label: 'Apply to sell', to: '/vendor/signup' },
      { label: 'Our standards', to: '/about' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', to: '/about' },
      { label: 'Shipping & returns', to: '/about' },
      { label: 'FAQ', to: '/about' },
      { label: 'Track an order', to: '/account' },
    ],
  },
]

export function Footer() {
  const { settings } = useSettings()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (email.trim()) setDone(true)
  }

  return (
    <footer className="mt-8 border-t border-border bg-surface-sunken">
      <div className="container-page grid grid-cols-1 gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <Link to="/" className="inline-flex" aria-label={`${settings.storeName} home`}>
            <Logo className="text-[1.4rem]" />
          </Link>
          <p className="mt-3 max-w-sm text-sm text-ink-soft">{settings.tagline}. One cart across many
            independent studios — we settle up with each maker so you don’t have to.</p>

          <form onSubmit={submit} className="mt-6 max-w-sm">
            <label className="text-caption font-medium uppercase tracking-wide text-ink-mute">
              The MorerDokan letter
            </label>
            {done ? (
              <p className="mt-2 text-sm text-success">Thanks — check your inbox to confirm.</p>
            ) : (
              <div className="mt-2 flex gap-2">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Button type="submit" aria-label="Subscribe" className="shrink-0 px-4">
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </form>

          <p className="mt-6 text-caption font-medium uppercase tracking-wide text-ink-mute">Follow along</p>
          <SocialLinks links={settings.socialLinks} className="mt-2.5" />
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-caption font-medium uppercase tracking-wide text-ink-mute">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-ink-soft transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-caption text-ink-mute sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.storeName}. A demonstration marketplace.</p>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-ink">Privacy</a>
            <a href="#" className="transition-colors hover:text-ink">Terms</a>
            <a href="#" className="transition-colors hover:text-ink">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
