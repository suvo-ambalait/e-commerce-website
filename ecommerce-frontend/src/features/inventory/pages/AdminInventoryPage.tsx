import { PageHeader } from '@/features/admin/components/primitives'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { InventoryStats } from '../components/InventoryStats'
import { InventoryTable } from '../components/InventoryTable'
import { CsvTools } from '../components/CsvTools'

export function AdminInventoryPage() {
  const { products } = useCatalog()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock, movements and reorder points across every vendor."
        action={<CsvTools products={products} allowImport />}
      />
      <InventoryStats products={products} />
      <InventoryTable products={products} scope="admin" detailBase="/admin/inventory" />
    </div>
  )
}
