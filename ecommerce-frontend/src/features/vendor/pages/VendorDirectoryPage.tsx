import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import type { IconType } from 'react-icons'
import { LuGlobe, LuPackage, LuStar, LuStore } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useCountUp } from '@/shared/hooks/useCountUp'
import { Container, PageHeader, Section } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { useVendors } from '../context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { VendorCard } from '../components/VendorCard'
import { SellCta } from '@/features/marketing/components/SellCta'

type Stat = { icon: IconType; value: number; decimals?: number; label: string }

/** Minimal stat: small outline icon + label, big number underneath. */
function StatCell({ icon: Icon, value, decimals = 0, label }: Stat) {
  const shown = useCountUp(value, { decimals })
  return (
    <div className="flex flex-col gap-2 py-5 lg:px-6 lg:first:pl-0 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:border-border">
      <dt className="flex items-center gap-2 text-caption text-ink-mute">
        <Icon className="h-4 w-4 text-accent" aria-hidden />
        {label}
      </dt>
      <dd className="font-display text-3xl font-bold leading-none tracking-[-0.03em] text-ink tabular-nums">
        {shown.toFixed(decimals)}
        {label === 'Average rating' && <span className="ml-1 text-base font-medium text-ink-mute">/ 5</span>}
      </dd>
    </div>
  )
}

export function VendorDirectoryPage() {
  useDocumentTitle('Shops · AmbalaEshop')
  const { activeVendors } = useVendors()
  const { productsByVendor } = useCatalog()

  const pieces = activeVendors.reduce((n, v) => n + productsByVendor(v.id).length, 0)
  const countries = new Set(activeVendors.map((v) => v.location.split(',').pop()?.trim())).size
  const avgRating = activeVendors.length
    ? activeVendors.reduce((n, v) => n + v.rating, 0) / activeVendors.length
    : 0

  const stats: Stat[] = [
    { icon: LuStore, value: activeVendors.length, label: 'Shops' },
    { icon: LuPackage, value: pieces, label: 'Products' },
    { icon: LuGlobe, value: countries, label: 'Countries' },
    { icon: LuStar, value: avgRating, decimals: 1, label: 'Average rating' },
  ]

  return (
    <>
      <Section size="sm" className="bg-surface-sunken/50">
        <Container>
          <PageHeader
            crumbs={[{ label: 'Home', to: '/' }, { label: 'Shops' }]}
            eyebrow="Our sellers"
            title={
              <>
                All shops on <em>AmbalaEshop</em>
              </>
            }
            description={`${activeVendors.length} checked shops sell on AmbalaEshop. Each shop has its own page, sets its own prices and sends its own parcels.`}
            action={
              <Link
                to="/vendor/signup"
                className="group inline-flex h-12 items-center gap-3 rounded-full bg-accent pl-6 pr-2 text-sm font-semibold text-on-accent shadow-[0_10px_28px_rgba(109,40,217,0.3)] transition-colors hover:bg-accent-hover"
              >
                Apply to sell
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6d28d9]">
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            }
          />

          {/* stats: plain row with hairline dividers */}
          <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t border-border lg:grid-cols-4 lg:gap-x-0">
            {stats.map((s) => (
              <StatCell key={s.label} {...s} />
            ))}
          </dl>
        </Container>
      </Section>

      <Section size="sm">
        <Container>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {activeVendors.map((vendor) => (
              <motion.div key={vendor.id} variants={fadeUp} className="h-full">
                <VendorCard vendor={vendor} productCount={productsByVendor(vendor.id).length} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-14">
            <SellCta />
          </div>
        </Container>
      </Section>
    </>
  )
}
