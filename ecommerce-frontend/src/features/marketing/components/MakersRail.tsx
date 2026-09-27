import { motion } from 'motion/react'
import { Container, Section } from '@/shared/ui'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { VendorCard } from '@/features/vendor/components/VendorCard'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { DisplayHeading } from './DisplayHeading'

export function MakersRail() {
  const { activeVendors } = useVendors()
  const { productsByVendor } = useCatalog()

  return (
    <Section className="bg-surface-sunken/60">
      <Container>
        <DisplayHeading
          eyebrow="The makers"
          title={
            <>
              Studios you’re <em>buying from</em>
            </>
          }
          description="Every product on MorerDokan is made by one of these independent workshops. Their name is on the piece, and on your receipt."
          action={{ to: '/vendors', label: 'Full directory' }}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {activeVendors.slice(0, 6).map((vendor) => (
            <motion.div key={vendor.id} variants={fadeUp} className="h-full">
              <VendorCard vendor={vendor} productCount={productsByVendor(vendor.id).length} />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}
