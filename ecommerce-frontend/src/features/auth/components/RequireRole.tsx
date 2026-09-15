import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Role } from '@/shared/types'

export function RequireRole({ role: _role, children: _children }: { role: Role; children: ReactNode }) {
  const location = useLocation()
  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}
