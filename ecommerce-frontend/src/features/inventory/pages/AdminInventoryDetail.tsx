import { useParams } from 'react-router-dom'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { InventoryDetailView } from '../components/InventoryDetailView'

export function AdminInventoryDetail() {
  const { id } = useParams()
  const { getProduct } = useCatalog()
  return (
    <InventoryDetailView product={id ? getProduct(id) : undefined} backTo="/admin/inventory" showVendor />
  )
}
