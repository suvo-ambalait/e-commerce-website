import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container, PageHeader, Section } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { useVendors } from '../context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { VendorCard } from '../components/VendorCard'
import { SellCta } from '@/features/marketing/components/SellCta'

export function VendorDirectoryPage() {
  useDocumentTitle('Shops · AmbalaEshop')
  const { activeVendors } = useVendors()
  const { productsByVendor } = useCatalog()

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
