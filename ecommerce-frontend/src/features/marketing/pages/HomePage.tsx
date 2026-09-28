import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Hero } from '../components/Hero'
import { ValueProps } from '../components/ValueProps'
import { CategoryStrip } from '../components/CategoryStrip'
import { FeaturedRail } from '../components/FeaturedRail'
import { MakersRail } from '../components/MakersRail'
import { EditorialPromo } from '../components/EditorialPromo'
import { Newsletter } from '../components/Newsletter'
import { PromoBanners } from '../components/PromoBanners'

export function HomePage() {
  useDocumentTitle('AmbalaEshop — Considered design, many makers')
  return (
    <>
      <Hero />
      <PromoBanners />
      <ValueProps />
      <CategoryStrip />
      <FeaturedRail />
      <MakersRail />
      <EditorialPromo />
      <Newsletter />
    </>
  )
}
