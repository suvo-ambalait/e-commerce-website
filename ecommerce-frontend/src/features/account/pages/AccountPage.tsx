import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ButtonLink, Container, Section } from '@/shared/ui'

export function AccountPage() {
  useDocumentTitle('Account · MorerDokan')

  return (
    <Section>
      <Container size="narrow" className="text-center">
        <h1 className="text-2xl text-ink">Sign in to see your account</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your orders, saved addresses and profile live here.
        </p>
        <ButtonLink to="/login" className="mt-5">
          Sign in
        </ButtonLink>
      </Container>
    </Section>
  )
}
