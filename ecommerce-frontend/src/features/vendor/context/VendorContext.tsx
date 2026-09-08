import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'
import { slugify } from '@/shared/lib/slug'
import { avatarFor, bannerFor } from '@/shared/lib/image'
import type { Vendor, VendorStatus } from '@/shared/types'
import { seedVendors } from '../data/vendors'

interface VendorContextValue {
  vendors: Vendor[]
  activeVendors: Vendor[]
  getVendor: (id: string) => Vendor | undefined
  getVendorBySlug: (slug: string) => Vendor | undefined
  registerVendor: (input: {
    name: string
    tagline: string
    bio: string
    location: string
    ownerEmail: string
  }) => Vendor
  updateVendor: (id: string, patch: Partial<Vendor>) => void
  setStatus: (id: string, status: VendorStatus) => void
}

const VendorContext = createContext<VendorContextValue | null>(null)

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = usePersistedState<Vendor[]>(storageKeys.vendors, seedVendors)

  const getVendor = useCallback((id: string) => vendors.find((v) => v.id === id), [vendors])
  const getVendorBySlug = useCallback((slug: string) => vendors.find((v) => v.slug === slug), [vendors])

  const registerVendor = useCallback<VendorContextValue['registerVendor']>(
    (input) => {
      const id = `v-${Date.now().toString(36)}`
      const vendor: Vendor = {
        id,
        slug: slugify(input.name) || id,
        name: input.name,
        tagline: input.tagline,
        bio: input.bio,
        logo: avatarFor(id, 'Decor'),
        banner: bannerFor(id, 'Studio'),
        location: input.location,
        rating: 0,
        reviewCount: 0,
        joinedAt: new Date().toISOString(),
        status: 'pending',
        ownerEmail: input.ownerEmail,
        policies: {
          shipping: 'Standard shipping, 3–5 business days.',
          returns: '30-day returns on unused items.',
        },
      }
      setVendors((prev) => [...prev, vendor])
      return vendor
    },
    [setVendors],
  )

  const updateVendor = useCallback<VendorContextValue['updateVendor']>(
    (id, patch) => setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v))),
    [setVendors],
  )

  const setStatus = useCallback<VendorContextValue['setStatus']>(
    (id, status) => setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v))),
    [setVendors],
  )

  const value = useMemo<VendorContextValue>(
    () => ({
      vendors,
      activeVendors: vendors.filter((v) => v.status === 'active'),
      getVendor,
      getVendorBySlug,
      registerVendor,
      updateVendor,
      setStatus,
    }),
    [vendors, getVendor, getVendorBySlug, registerVendor, updateVendor, setStatus],
  )

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>
}

export function useVendors(): VendorContextValue {
  const ctx = useContext(VendorContext)
  if (!ctx) throw new Error('useVendors must be used within a VendorProvider')
  return ctx
}
