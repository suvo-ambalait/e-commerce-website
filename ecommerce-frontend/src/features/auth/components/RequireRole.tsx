import type { ReactNode } from 'react'
import type { Role } from '@/shared/types'

// TODO: add real auth/role check once auth state exists.
export function RequireRole({ role: _role, children }: { role: Role; children: ReactNode }) {
  return <>{children}</>
}
