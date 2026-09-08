import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Container, Section, SectionHeading } from '@/shared/ui'
import { fadeUp, stagger } from '@/shared/lib/motion'
import { VendorCard } from '@/features/vendor/components/VendorCard'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'

export function MakersRail() {
  const { activeVendors } = useVendors()
  const { productsByVendor } = useCatalog()

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="The makers"
          title="Studios you’re buying from"
          description="Every product on MorerDokan is made by one of these independent workshops. Their name is on the piece, and on your receipt."
          action={
            <Link to="/vendors" className="text-sm text-accent underline-offset-4 hover:underline">
              Full directory
            </Link>
          }
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {activeVendors.slice(0, 6).map((vendor) => (
            <motion.div key={vendor.id} variants={fadeUp}>
              <VendorCard vendor={vendor} productCount={productsByVendor(vendor.id).length} />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}
