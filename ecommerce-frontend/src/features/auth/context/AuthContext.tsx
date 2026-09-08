import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'
import type { AuthUser, Role } from '@/shared/types'
import { seedVendors } from '@/features/vendor/data/vendors'

export const ADMIN_EMAIL = 'admin@morerdokan.example'

/** Demo accounts that always work, regardless of what's in storage. */
const knownAccounts: AuthUser[] = [
  { name: 'Platform Admin', email: ADMIN_EMAIL, role: 'admin' },
  ...seedVendors.map<AuthUser>((v) => ({
    name: `${v.name} Studio`,
    email: v.ownerEmail,
    role: 'vendor',
    vendorId: v.id,
  })),
]

interface AuthContextValue {
  user: AuthUser | null
  users: AuthUser[]
  isAdmin: boolean
  isVendor: boolean
  role: Role | null
  login: (email: string, password: string) => AuthUser
  signup: (name: string, email: string, password: string, role?: Role, vendorId?: string) => AuthUser
  logout: () => void
  updateProfile: (name: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = usePersistedState<AuthUser | null>(storageKeys.auth, null)
  const [users, setUsers] = usePersistedState<AuthUser[]>(storageKeys.users, [])

  const upsert = useCallback(
    (next: AuthUser) =>
      setUsers((prev) => {
        const exists = prev.some((u) => u.email === next.email)
        return exists ? prev.map((u) => (u.email === next.email ? next : u)) : [...prev, next]
      }),
    [setUsers],
  )

  const resolve = useCallback(
    (email: string): AuthUser => {
      const normalized = email.trim().toLowerCase()
      return (
        knownAccounts.find((a) => a.email === normalized) ??
        users.find((u) => u.email === normalized) ?? {
          name: normalized.split('@')[0] || 'Guest',
          email: normalized,
          role: 'customer',
        }
      )
    },
    [users],
  )

  const login = useCallback<AuthContextValue['login']>(
    (email) => {
      const next = resolve(email)
      setUser(next)
      upsert(next)
      return next
    },
    [resolve, setUser, upsert],
  )

  const signup = useCallback<AuthContextValue['signup']>(
    (name, email, _password, role = 'customer', vendorId) => {
      const next: AuthUser = {
        name: name.trim() || 'Guest',
        email: email.trim().toLowerCase(),
        role,
        ...(vendorId ? { vendorId } : {}),
      }
      setUser(next)
      upsert(next)
      return next
    },
    [setUser, upsert],
  )

  const logout = useCallback(() => setUser(null), [setUser])

  const updateProfile = useCallback(
    (name: string) =>
      setUser((prev) => {
        if (!prev) return prev
        const next = { ...prev, name }
        upsert(next)
        return next
      }),
    [setUser, upsert],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      users,
      isAdmin: user?.role === 'admin',
      isVendor: user?.role === 'vendor',
      role: user?.role ?? null,
      login,
      signup,
      logout,
      updateProfile,
    }),
    [user, users, login, signup, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
