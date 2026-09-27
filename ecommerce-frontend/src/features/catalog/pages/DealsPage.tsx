import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Breadcrumbs, Container, Section } from '@/shared/ui'
import { ArrowRightIcon, SparkIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { discountFraction, formatPriceWhole, pluralize } from '@/shared/lib/format'
import { useCatalog } from '../context/CatalogContext'
import { ProductGrid } from '../components/ProductGrid'

export function DealsPage() {
  useDocumentTitle('Sale · AmbalaEshop')
  const { products } = useCatalog()
  const [category, setCategory] = useState<string | null>(null)

  const deals = useMemo(
    () =>
      products
        .filter((p) => p.originalPrice && p.originalPrice > p.price)
        .sort((a, b) => discountFraction(b.price, b.originalPrice) - discountFraction(a.price, a.originalPrice)),
    [products],
  )

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of deals) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [deals])

  const shown = category ? deals.filter((p) => p.category === category) : deals
  const maxOff = Math.round(Math.max(0, ...deals.map((p) => discountFraction(p.price, p.originalPrice))) * 100)
  const saved = deals.reduce((n, p) => n + ((p.originalPrice ?? p.price) - p.price), 0)

  return (
    <Section size="sm">
      <Container>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Sale' }]} />

        {/* banner — fixed violet so it reads the same in both themes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mt-5 overflow-hidden rounded-3xl bg-[#6d28d9] px-6 py-10 text-white sm:px-10 sm:py-12"
        >
          {/* decorative rings — `!` beats the global `* { border-color }` rule in index.css */}
          <div className="pointer-events-none absolute -right-24 -top-40 h-112 w-112 rounded-full border border-white/15!" />
          <div className="pointer-events-none absolute -right-4 -top-20 h-72 w-72 rounded-full border border-white/15!" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                <SparkIcon className="h-3.5 w-3.5" />
                Shop markdowns
              </p>
              {/* `!` beats the global unlayered h1 font rule in index.css */}
              <h1 className="mt-3 font-display! text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] font-extrabold! leading-[0.95] tracking-[-0.045em]! text-white">
                On sale <em className="font-medium text-white/90">now.</em>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                Pieces marked down by their makers — mostly last-of-a-run and seconds. Once they’re gone, they’re
                gone.
              </p>
            </div>

            {deals.length > 0 && (
              <dl className="flex gap-3">
                {[
                  { value: `${maxOff}%`, label: 'Biggest markdown' },
                  { value: String(deals.length), label: pluralize(deals.length, 'Piece') + ' on sale' },
                  { value: formatPriceWhole(saved), label: 'Total off list' },
                ].map((s) => (
                  <div key={s.label} className="min-w-24 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
                    <dd className="font-display text-2xl font-extrabold leading-none tracking-[-0.03em] tabular-nums">
                      {s.value}
                    </dd>
                    <dt className="mt-1.5 text-[11px] text-white/75">{s.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </motion.div>

        {deals.length > 0 ? (
          <>
            {/* category chips */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              {[['All', deals.length] as const, ...categories].map(([name, count]) => {
                const value = name === 'All' ? null : name
                const on = category === value
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCategory(value)}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-full border pl-4 pr-1.5 text-sm font-semibold transition-colors',
                      on ? 'border-ink! bg-ink text-bg' : 'border-border-strong text-ink-soft hover:border-accent! hover:text-accent',
                    )}
                  >
                    {name}
                    <span
                      className={cn(
                        'flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums',
                        on ? 'bg-accent text-on-accent' : 'bg-surface-sunken text-ink-mute',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <ProductGrid key={category ?? 'all'} products={shown} className="mt-8" />
          </>
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-border bg-surface px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <SparkIcon className="h-7 w-7" />
            </span>
            <p className="mt-5 font-display text-xl font-bold text-ink">No markdowns right now</p>
            <p className="mt-2 text-sm text-ink-soft">Check back after the next shop restock.</p>
            <Link
              to="/shop"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Shop everything
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </Container>
    </Section>
  )
}
