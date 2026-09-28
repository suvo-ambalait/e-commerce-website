import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ButtonLink, Container } from '@/shared/ui'

export function NotFoundPage() {
  useDocumentTitle('Page not found · AmbalaEshop')
  return (
    <Container size="narrow" className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-serif text-display text-border-strong">404</p>
      <h1 className="mt-2 text-2xl text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        This link is broken or the product is no longer for sale. Please go back to the shop.
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink to="/">Home</ButtonLink>
        <ButtonLink to="/shop" variant="secondary">
          Browse the shop
        </ButtonLink>
      </div>
    </Container>
  )
}
