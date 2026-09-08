import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader, StatCard } from '../components/primitives'
import { Avatar, Badge, Button, ButtonLink } from '@/shared/ui'
import { formatDateLong, formatPriceWhole } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import { useOrders } from '@/features/orders/context/OrdersContext'
import { useSettings } from '../context/SettingsContext'
import { summariseVendorSales } from '@/features/orders/lib/analytics'

export function AdminVendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getVendor, setStatus } = useVendors()
  const { productsByVendor } = useCatalog()
  const { orders } = useOrders()
  const { settings } = useSettings()
  const { notify } = useToast()

  const vendor = id ? getVendor(id) : undefined
  if (!vendor) {
    return (
      <div>
        <p className="text-sm text-ink-mute">Vendor not found.</p>
        <ButtonLink to="/admin/vendors" variant="secondary" className="mt-4">
          Back to vendors
        </ButtonLink>
      </div>
    )
  }

  const products = productsByVendor(vendor.id)
  const sales = summariseVendorSales(orders, vendor.id, settings.commissionRate)

  const act = (next: 'active' | 'suspended' | 'pending', message: string) => {
    setStatus(vendor.id, next)
    notify(message)
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/vendors" className="text-caption text-accent hover:underline">
        ← All vendors
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <Avatar src={vendor.logo} name={vendor.name} size={56} />
          <div>
            <PageHeader title={vendor.name} description={vendor.tagline} />
            <div className="mt-1 flex items-center gap-2 text-caption text-ink-mute">
              <Badge tone={vendor.status === 'active' ? 'success' : vendor.status === 'pending' ? 'warning' : 'danger'}>
                {vendor.status}
              </Badge>
              <span>{vendor.location}</span>
              <span>· since {formatDateLong(vendor.joinedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {vendor.status !== 'active' && (
            <Button size="sm" onClick={() => act('active', `${vendor.name} approved`)}>
              Approve
            </Button>
          )}
          {vendor.status === 'active' && (
            <Button size="sm" variant="danger" onClick={() => act('suspended', `${vendor.name} suspended`)}>
              Suspend
            </Button>
          )}
          {vendor.status === 'suspended' && (
            <Button size="sm" variant="secondary" onClick={() => act('active', `${vendor.name} reinstated`)}>
              Reinstate
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => navigate(`/vendor/${vendor.slug}`)}>
            View storefront
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Products" value={String(products.length)} />
        <StatCard label="Orders" value={String(sales.orders)} />
        <StatCard label="Gross" value={formatPriceWhole(sales.gross)} />
        <StatCard label="Commission earned" value={formatPriceWhole(sales.commission)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="text-sm font-medium text-ink">About</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{vendor.bio}</p>
          <p className="mt-3 text-caption text-ink-mute">Owner: {vendor.ownerEmail}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="text-sm font-medium text-ink">Policies</h3>
          <p className="mt-2 text-sm text-ink-soft">
            <span className="text-ink-mute">Shipping — </span>
            {vendor.policies.shipping}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            <span className="text-ink-mute">Returns — </span>
            {vendor.policies.returns}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ink">Catalogue</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {products.map((p) => (
            <Link key={p.id} to={`/admin/products/${p.id}/edit`} className="group">
              <img src={p.images[0]} alt="" className="aspect-square w-full rounded-sm object-cover" />
              <p className="mt-1 truncate text-caption text-ink-soft group-hover:text-ink">{p.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
