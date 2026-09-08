import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/features/admin/components/primitives'
import { useToast } from '@/shared/ui/Toast'
import { useCurrentVendor } from '../../lib/useCurrentVendor'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { ProductForm } from '@/features/catalog/components/ProductForm'

export function VendorProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vendor = useCurrentVendor()
  const { getProduct, addProduct, updateProduct } = useCatalog()
  const { notify } = useToast()

  const product = id ? getProduct(id) : undefined
  const editing = Boolean(id)

  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>
  if (editing && !product) return <p className="text-sm text-ink-mute">Product not found.</p>

  return (
    <div className="space-y-5">
      <PageHeader title={editing ? 'Edit product' : 'New product'} />
      <ProductForm
        product={product}
        vendorId={vendor.id}
        lockVendor
        onCancel={() => navigate('/vendor/dashboard/products')}
        onSubmit={(input) => {
          if (editing && product) {
            updateProduct(product.id, { ...input, vendorId: vendor.id })
            notify('Product updated', 'success')
          } else {
            addProduct({ ...input, vendorId: vendor.id })
            notify('Product created', 'success')
          }
          navigate('/vendor/dashboard/products')
        }}
      />
    </div>
  )
}
