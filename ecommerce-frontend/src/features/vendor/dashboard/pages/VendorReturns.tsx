import { PageHeader } from '@/features/admin/components/primitives'
import { ReturnsTable } from '@/features/marketplace/components/ReturnsTable'
import { returnsStore } from '@/features/marketplace/stores'
import { useCurrentVendor } from '../../lib/useCurrentVendor'

export function VendorReturns() {
  const vendor = useCurrentVendor()
  const [all] = returnsStore.useStore()
  if (!vendor) return <p className="text-sm text-ink-mute">No vendor linked.</p>
  const open = all.filter((r) => r.vendorId === vendor.id && r.status === 'Requested').length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Returns"
        description={`${open} waiting for you · Reply within 2 working days. Approving a cancellation cancels the parcel and restocks it.`}
      />
      <ReturnsTable vendorId={vendor.id} orderPath={(n) => `/vendor/dashboard/orders/${n}`} />
    </div>
  )
}
