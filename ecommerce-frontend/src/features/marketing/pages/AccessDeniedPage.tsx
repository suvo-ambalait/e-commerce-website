import { Link, useLocation } from 'react-router-dom'
import { LuShieldX } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Container, Section } from '@/shared/ui'

/**
 * Shown when a signed-in user opens a dashboard their role can't use.
 * RequireRole should redirect here with `state: { area: 'admin' | 'vendor' }`.
 */
export function AccessDeniedPage() {
  useDocumentTitle('Access denied · AmbalaEshop')
  const { state } = useLocation() as { state?: { area?: 'admin' | 'vendor' } }
  const area = state?.area

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container size="narrow">
        <div className="flex flex-col items-center rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <LuShieldX className="h-8 w-8" />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-danger">Error 403</p>
          <h1 className="mt-1 font-display! text-3xl font-extrabold! tracking-[-0.03em]! text-ink">You can’t open this page</h1>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            {area === 'admin'
              ? 'The admin dashboard is only for AmbalaEshop staff.'
              : area === 'vendor'
                ? 'The seller dashboard is only for approved shops. Apply to sell, or sign in with your shop account.'
                : 'Your account doesn’t have access to this area.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Back to the shop
            </Link>
            {area === 'vendor' ? (
              <Link
                to="/vendor/signup"
                className="inline-flex h-12 items-center rounded-full border border-border-strong bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Apply to sell
              </Link>
            ) : (
              <Link
                to="/logout"
                className="inline-flex h-12 items-center rounded-full border border-border-strong bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Sign in with another account
              </Link>
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
