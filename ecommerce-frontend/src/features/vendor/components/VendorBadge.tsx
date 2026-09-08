import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useVendors } from '../context/VendorContext'

export function VendorBadge({
  vendorId,
  className,
  withLabel = true,
}: {
  vendorId: string
  className?: string
  withLabel?: boolean
}) {
  const { getVendor } = useVendors()
  const vendor = getVendor(vendorId)
  if (!vendor) return null

  return (
    <Link
      to={`/vendor/${vendor.slug}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-1 text-caption text-ink-mute transition-colors hover:text-ink',
        className,
      )}
    >
      {withLabel && <span>by</span>}
      <span className="underline-offset-2 hover:underline">{vendor.name}</span>
    </Link>
  )
}
