import { useParams } from 'react-router-dom'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useCurrentVendor } from '@/features/vendor/lib/useCurrentVendor'
import { InventoryDetailView } from '../components/InventoryDetailView'

export function VendorInventoryDetail() {
  const { id } = useParams()
  const vendor = useCurrentVendor()
  const { getProduct } = useCatalog()
  const product = id ? getProduct(id) : undefined
  const owned = product && vendor && product.vendorId === vendor.id ? product : undefined

  return (
    <InventoryDetailView product={owned} backTo="/vendor/dashboard/inventory" showVendor={false} />
  )
}
