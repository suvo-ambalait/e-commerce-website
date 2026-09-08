import { PageHeader } from '@/features/admin/components/primitives'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useCurrentVendor } from '@/features/vendor/lib/useCurrentVendor'
import { InventoryStats } from '../components/InventoryStats'
import { InventoryTable } from '../components/InventoryTable'
import { CsvTools } from '../components/CsvTools'

export function VendorInventoryPage() {
  const vendor = useCurrentVendor()
  const { productsByVendor } = useCatalog()

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>
  const products = productsByVendor(vendor.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Your stock levels and movement history."
        action={<CsvTools products={products} allowImport={false} />}
      />
      <InventoryStats products={products} />
      <InventoryTable products={products} scope="vendor" detailBase="/vendor/dashboard/inventory" />
    </div>
  )
}
