import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LuCircleCheck } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { removeStoredToken } from '@/shared/lib/tokenStorage'
import { Container, Section } from '@/shared/ui'

/** Clears the stored sign-in token and confirms the user is signed out. */
export function LogoutPage() {
  useDocumentTitle('Signed out · AmbalaEshop')

  useEffect(() => {
    // TODO: also call the backend's POST /auth/logout once auth requests are wired up
    removeStoredToken()
  }, [])

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container size="narrow">
        <div className="flex flex-col items-center rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success">
            <LuCircleCheck className="h-8 w-8" />
          </span>
          <h1 className="mt-5 font-display! text-3xl font-extrabold! tracking-[-0.03em]! text-ink">You’re signed out</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-soft">
            Thank you for shopping with AmbalaEshop. Your cart and saved items are still saved on this device.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Sign in again
            </Link>
            <Link
              to="/"
              className="inline-flex h-12 items-center rounded-full border border-border-strong bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Back to the shop
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  )
}
