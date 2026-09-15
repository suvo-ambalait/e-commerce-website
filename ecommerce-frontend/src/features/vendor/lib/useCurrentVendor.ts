import { useVendors } from '../context/VendorContext'

/** The vendor being previewed in the dashboard. */
export function useCurrentVendor() {
  const { vendors } = useVendors()
  return vendors[0]
}
