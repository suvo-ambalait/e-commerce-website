import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'

export interface SocialLink {
  label: string
  url: string
}

export interface StoreSettings {
  storeName: string
  tagline: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  socialLinks: SocialLink[]
  shippingFlatRate: number
  freeShippingThreshold: number
  taxRate: number
  commissionRate: number
  /** global reorder point — a product is "low" at or below this unless it sets its own */
  lowStockThreshold: number
}

interface SettingsContextValue {
  settings: StoreSettings
  updateSettings: (settings: StoreSettings) => void
}

const defaultSettings: StoreSettings = {
  storeName: 'AmbalaEshop',
  tagline: 'Considered design, many makers',
  contactEmail: 'hello@ambalaeshop.example',
  contactPhone: '+1 (555) 240-1998',
  contactAddress: '14 Rue des Artisans, Studio 3 · Brooklyn, NY',
  socialLinks: [
    { label: 'Instagram', url: '#' },
    { label: 'Pinterest', url: '#' },
    { label: 'TikTok', url: '#' },
    { label: 'X', url: '#' },
    { label: 'Journal', url: '#' },
  ],
  shippingFlatRate: 6,
  freeShippingThreshold: 120,
  taxRate: 0.08,
  commissionRate: 0.12,
  lowStockThreshold: 8,
}

/**
 * Browsers that loaded the app before the rename still have the old brand
 * saved in localStorage, which would override the new defaults. Swap those
 * old values for the current defaults; anything an admin chose stays as is.
 */
const LEGACY_STORE_NAME = 'MorerDokan'
const LEGACY_CONTACT_EMAIL = 'hello@morerdokan.example'

function migrateLegacyBrand(s: StoreSettings): StoreSettings {
  return {
    ...s,
    storeName: s.storeName === LEGACY_STORE_NAME ? defaultSettings.storeName : s.storeName,
    contactEmail: s.contactEmail === LEGACY_CONTACT_EMAIL ? defaultSettings.contactEmail : s.contactEmail,
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = usePersistedState<StoreSettings>(storageKeys.settings, defaultSettings)

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings: migrateLegacyBrand({ ...defaultSettings, ...settings }),
      updateSettings: setSettings,
    }),
    [settings, setSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}
