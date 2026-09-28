import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '@/features/admin/context/SettingsContext'
import { ArrowRightIcon, CheckIcon } from '@/shared/ui/icons'
import { SocialLinks } from './SocialLinks'
import { BrandLockup } from './Logo'

type FooterLink = { label: string; to: string; badge?: string }

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/shop' },
      { label: 'New products', to: '/shop?sort=new' },
      { label: 'On sale', to: '/deals', badge: 'Sale' },
      { label: 'Gift ideas', to: '/shop' },
      { label: 'Customer reviews', to: '/reviews' },
    ],
  },
  {
    title: 'Sellers',
    links: [
      { label: 'All shops', to: '/vendors' },
      { label: 'Sell on AmbalaEshop', to: '/vendor/signup' },
      { label: 'Check my application', to: '/vendor/application' },
      { label: 'About us', to: '/about' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Contact us', to: '/contact' },
      { label: 'Delivery & returns', to: '/shipping-returns' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Track an order', to: '/track-order' },
    ],
  },
]

/**
 * Dark footer — fixed colours so it reads as a dark block in both themes.
 * Border colours carry `!` to beat the global `* { border-color }` rule in index.css.
 */
export function Footer() {
  const { settings } = useSettings()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (email.trim()) setDone(true)
  }

  return (
    <footer className="overflow-hidden bg-[#0b0a10] text-white">
      <div className="container-page pt-12 md:pt-16">
        {/* newsletter band */}
        <div className="relative overflow-hidden rounded-3xl bg-[#6d28d9] px-6 py-8 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 rounded-full border border-white/15!" />
          <div className="pointer-events-none absolute -top-24 left-[58%] h-64 w-64 rounded-full border border-white/15!" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                {settings.storeName} newsletter
              </p>
              {/* `!` beats the global unlayered h2 font rule in index.css */}
              <h2 className="mt-2 font-display! text-[clamp(1.6rem,1.2rem+1.8vw,2.4rem)] font-extrabold! leading-[1.05] tracking-[-0.035em]! text-white">
                New products and offers,
                <br />
                <em className="font-medium text-white/90">sent to your email.</em>
              </h2>
            </div>

            <form onSubmit={submit} className="w-full max-w-md shrink-0">
              <label htmlFor="footer-email" className="text-caption font-semibold text-white">
                Email address
              </label>
              {done ? (
                <p className="mt-2 flex h-13 items-center gap-2.5 rounded-full bg-white/15 px-5 text-sm font-medium text-white">
                  <CheckIcon className="h-4 w-4" />
                  Thank you! Please check your email.
                </p>
              ) : (
                <div className="mt-2 flex h-13 items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-[0_12px_30px_rgba(20,8,50,0.3)]">
                  <input
                    id="footer-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0b0a10] outline-none placeholder:text-[#8a849c] focus:ring-0"
                  />
                  <button
                    type="submit"
                    className="group flex h-full shrink-0 items-center gap-2 rounded-full bg-[#0b0a10] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2a2144]"
                  >
                    Subscribe
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* brand + link columns */}
        <div className="grid grid-cols-1 gap-12 py-14 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link to="/" className="inline-flex" aria-label={`${settings.storeName} home`}>
              <BrandLockup onDark className="text-2xl" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#b8b3c7]">
              {settings.tagline}. Buy from many shops in one cart and pay once — with cash on delivery, bKash,
              Nagad or card.
            </p>

            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a849c]">Follow along</p>
            <SocialLinks links={settings.socialLinks} variant="inverse" className="mt-3" />
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-sans! text-[11px] font-semibold! uppercase tracking-[0.14em]! text-[#a78bfa]">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="inline-flex items-center gap-2 text-sm text-[#d4cfe3] transition-colors hover:text-white"
                      >
                        {link.label}
                        {link.badge && (
                          <span className="rounded-full bg-[#6d28d9] px-2 py-0.5 text-[10px] font-semibold text-white">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* oversized watermark wordmark */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p className="container-page -mb-[0.18em] whitespace-nowrap text-center font-display text-[clamp(4rem,17vw,15rem)] font-extrabold leading-none tracking-[-0.06em] text-white/[0.045]">
          {settings.storeName}
        </p>
      </div>

      <div className="border-t border-white/10!">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-caption text-[#8a849c] sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link to="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link to="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
