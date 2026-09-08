import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, DataTable, Toolbar, type Column } from '../components/primitives'
import { Avatar, Badge, Select } from '@/shared/ui'
import { formatDate } from '@/shared/lib/format'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import type { Vendor, VendorStatus } from '@/shared/types'

const tones: Record<VendorStatus, Parameters<typeof Badge>[0]['tone']> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
}

export function AdminVendors() {
  const { vendors } = useVendors()
  const { productsByVendor } = useCatalog()
  const [status, setStatus] = useState<VendorStatus | ''>('')

  const rows = vendors.filter((v) => !status || v.status === status)

  const columns: Column<Vendor>[] = [
    {
      header: 'Vendor',
      cell: (v) => (
        <Link to={`/admin/vendors/${v.id}`} className="flex items-center gap-3 font-medium text-ink hover:underline">
          <Avatar src={v.logo} name={v.name} size={32} />
          {v.name}
        </Link>
      ),
    },
    { header: 'Location', cell: (v) => v.location, hideBelow: 'md' },
    { header: 'Products', cell: (v) => productsByVendor(v.id).length, hideBelow: 'sm' },
    { header: 'Rating', cell: (v) => `${v.rating.toFixed(1)} (${v.reviewCount})`, hideBelow: 'sm' },
    { header: 'Joined', cell: (v) => formatDate(v.joinedAt), hideBelow: 'lg' },
    { header: 'Status', cell: (v) => <Badge tone={tones[v.status]}>{v.status}</Badge> },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Vendors" description={`${vendors.length} studios on the platform`} />
      <Toolbar>
        <Select
          size="sm"
          value={status}
          onChange={(v) => setStatus(v as VendorStatus | '')}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'pending', label: 'Pending' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          className="w-44"
        />
      </Toolbar>
      <DataTable rows={rows} columns={columns} keyOf={(v) => v.id} empty="No vendors match." />
    </div>
  )
}
