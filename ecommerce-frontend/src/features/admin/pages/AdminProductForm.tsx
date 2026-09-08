import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/primitives'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { ProductForm } from '@/features/catalog/components/ProductForm'

export function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProduct, addProduct, updateProduct } = useCatalog()
  const { vendors } = useVendors()
  const { notify } = useToast()

  const product = id ? getProduct(id) : undefined
  const editing = Boolean(id)
  if (editing && !product) return <p className="text-sm text-ink-mute">Product not found.</p>

  return (
    <div className="space-y-5">
      <PageHeader title={editing ? 'Edit product' : 'New product'} />
      <ProductForm
        product={product}
        vendorId={product?.vendorId ?? vendors[0]?.id ?? ''}
        onCancel={() => navigate('/admin/products')}
        onSubmit={(input) => {
          if (editing && product) {
            updateProduct(product.id, input)
            notify('Product updated', 'success')
          } else {
            addProduct(input)
            notify('Product created', 'success')
          }
          navigate('/admin/products')
        }}
      />
    </div>
  )
}
