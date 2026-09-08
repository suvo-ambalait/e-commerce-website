import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '@/shared/types'
import { Button, ButtonLink, Container } from '@/shared/ui'

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== role && user.role !== 'admin') {
    return (
      <Container size="narrow" className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="text-caption font-medium uppercase tracking-[0.14em] text-accent">Restricted</p>
        <h1 className="mt-3 text-2xl text-ink">This area needs a {role} account</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          You’re signed in as {user.email}. Switch accounts to continue.
        </p>
        <div className="mt-6 flex gap-3">
          <ButtonLink to="/">Back to shopping</ButtonLink>
          <Button variant="secondary" onClick={() => window.location.assign('/login')}>
            Switch account
          </Button>
        </div>
      </Container>
    )
  }

  return <>{children}</>
}
