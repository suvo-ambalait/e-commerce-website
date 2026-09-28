import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LuSearch, LuShoppingBag } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { easeEditorial } from '@/shared/lib/motion'
import { useCatalog } from '@/features/catalog/context/CatalogContext'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: easeEditorial, delay },
})

export function NotFoundPage() {
  useDocumentTitle('Page not found · AmbalaEshop')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { categories } = useCatalog()
  const [q, setQ] = useState('')

  const search = (e: FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/shop')
  }

  return (
    <section className="relative overflow-hidden bg-surface-sunken/50">
      {/* decorative rings, same as the About hero — `!` beats the global border-color rule */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-112 w-112 rounded-full border border-accent/15!" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-112 w-112 rounded-full border border-accent/15!" />

      <Container size="narrow" className="relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        {/* 4 [bag] 4 — the bag stands in for the zero */}
        <motion.div
          {...rise(0)}
          aria-hidden
          className="flex items-center gap-2 font-display text-[clamp(5rem,3rem+10vw,9rem)] font-extrabold leading-none tracking-[-0.06em] text-ink sm:gap-4"
        >
          <span>4</span>
          <motion.span
            initial={{ rotate: -30, scale: 0.6, opacity: 0 }}
            animate={{ rotate: -10, scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: easeEditorial, delay: 0.15 }}
            className="relative flex h-[0.82em] w-[0.82em] items-center justify-center rounded-[28%] bg-accent text-on-accent shadow-[0_18px_40px_rgba(109,40,217,0.35)]"
          >
            <LuShoppingBag className="h-[0.42em] w-[0.42em]" strokeWidth={2.2} />
          </motion.span>
          <span>4</span>
        </motion.div>

        <motion.p
          {...rise(0.1)}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/20! bg-accent-soft py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-ink-soft"
        >
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-on-accent">Oops</span>
          This page is out of stock
        </motion.p>

        {/* `!` beats the global unlayered h1 font rule in index.css */}
        <motion.h1
          {...rise(0.16)}
          className="mt-5 font-display! text-[clamp(2rem,1.4rem+2.6vw,3rem)] font-extrabold! leading-none tracking-[-0.04em]! text-ink text-balance"
        >
          We couldn’t find <em className="font-medium text-accent">that page.</em>
        </motion.h1>

        <motion.p {...rise(0.22)} className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
          The link may be broken, or the product is no longer for sale. Try a search or pick a category below.
        </motion.p>
        <motion.p {...rise(0.24)} className="mt-2 max-w-full truncate rounded-md bg-surface px-2 py-0.5 font-mono text-caption text-ink-mute ring-1 ring-border">
          {pathname}
        </motion.p>

        {/* search */}
        <motion.form {...rise(0.3)} onSubmit={search} role="search" className="mt-8 w-full max-w-md">
          <label className="flex h-13 items-center gap-2 rounded-full border border-border-strong bg-surface pl-5 pr-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-accent! focus-within:ring-4 focus-within:ring-accent/15">
            <LuSearch className="h-4.5 w-4.5 shrink-0 text-ink-mute" aria-hidden />
            <span className="sr-only">Search products</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for a product…"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute"
            />
            <button
              type="submit"
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Search
            </button>
          </label>
        </motion.form>

        {/* category shortcuts */}
        {categories.length > 0 && (
          <motion.div {...rise(0.36)} className="mt-5 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/shop?category=${encodeURIComponent(c.name)}`}
                className="h-9 rounded-full border border-border-strong bg-surface px-4 text-caption font-semibold leading-9 text-ink-soft transition-colors hover:border-accent! hover:text-accent"
              >
                {c.name}
              </Link>
            ))}
          </motion.div>
        )}

        {/* actions */}
        <motion.div {...rise(0.42)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/shop"
            className="group inline-flex h-12 items-center gap-3 rounded-full bg-accent pl-6 pr-2 text-sm font-semibold text-on-accent shadow-[0_10px_28px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover"
          >
            Browse the shop
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6d28d9]">
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex h-12 items-center rounded-full border border-border-strong bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:border-accent! hover:text-accent"
          >
            Go home
          </Link>
        </motion.div>
      </Container>
    </section>
  )
}
