import { useAuth } from '@/features/auth/context/AuthContext'
import { useVendors } from '../context/VendorContext'

/** The vendor the signed-in user owns, or the first vendor for an admin preview. */
export function useCurrentVendor() {
  const { user } = useAuth()
  const { getVendor, vendors } = useVendors()
  if (user?.vendorId) return getVendor(user.vendorId)
  if (user?.role === 'admin') return vendors[0]
  return undefined
}
