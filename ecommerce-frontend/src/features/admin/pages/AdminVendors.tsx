import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuBan, LuCircleCheck, LuExternalLink, LuEye, LuMail, LuRotateCcw } from 'react-icons/lu'
import { PageHeader, DataTable, BulkButton, type Column } from '../components/primitives'
import {
  ColumnsMenu,
  DensityToggle,
  ExportButton,
  Pill,
  PrimaryLink,
  TableSearch,
  TableTabs,
  TableToolbar,
  downloadCsv,
  useTablePrefs,
  type PillTone,
} from '../components/TableKit'
import { Avatar } from '@/shared/ui'
import { StarIcon } from '@/shared/ui/icons'
import { formatDate } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import type { Vendor, VendorStatus } from '@/shared/types'

type Tab = 'all' | VendorStatus

const tone: Record<VendorStatus, PillTone> = { active: 'success', pending: 'warning', suspended: 'danger' }
const label: Record<VendorStatus, string> = { active: 'Active', pending: 'Pending', suspended: 'Suspended' }

export function AdminVendors() {
  const navigate = useNavigate()
  const { vendors, setStatus } = useVendors()
  const { allProducts } = useCatalog()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [prefs, setPrefs] = useTablePrefs('admin-vendors')

  const pieces = (id: string) => allProducts.filter((p) => p.vendorId === id && (p.status ?? 'active') !== 'archived').length
  const count = (st: VendorStatus) => vendors.filter((v) => v.status === st).length

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vendors.filter((v) => {
      if (tab !== 'all' && v.status !== tab) return false
      if (q && !`${v.name} ${v.location} ${v.ownerEmail}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [vendors, search, tab])

  const change = (ids: string[], status: VendorStatus) => {
    ids.forEach((id) => setStatus(id, status))
    const verb = status === 'active' ? 'Approved' : status === 'suspended' ? 'Suspended' : 'Updated'
    notify(`${verb}: ${ids.length} shop${ids.length > 1 ? 's' : ''}`, 'success')
  }

  const columns: Column<Vendor>[] = [
    {
      header: 'Shop',
      id: 'studio',
      sortValue: (v) => v.name,
      cell: (v) => (
        <Link to={`/admin/vendors/${v.id}`} className="group flex items-center gap-3">
          <Avatar src={v.logo} name={v.name} size={40} className="rounded-xl" />
          <span className="min-w-0">
            <span className="block max-w-48 truncate font-display font-bold text-ink group-hover:text-accent">{v.name}</span>
            <span className="block max-w-48 truncate text-[11px] text-ink-mute">{v.tagline}</span>
          </span>
        </Link>
      ),
    },
    {
      header: 'Location',
      id: 'location',
      hideBelow: 'lg',
      sortValue: (v) => v.location,
      cell: (v) => <span className="whitespace-nowrap text-ink-soft">{v.location}</span>,
    },
    {
      header: 'Pieces',
      id: 'pieces',
      align: 'right',
      sortValue: (v) => pieces(v.id),
      cell: (v) => <span className="font-bold text-ink tabular-nums">{pieces(v.id)}</span>,
    },
    {
      header: 'Rating',
      id: 'rating',
      hideBelow: 'sm',
      sortValue: (v) => v.rating,
      cell: (v) => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <StarIcon className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="font-semibold text-ink tabular-nums">{v.rating.toFixed(1)}</span>
          <span className="text-ink-mute tabular-nums">({v.reviewCount})</span>
        </span>
      ),
    },
    {
      header: 'Joined',
      id: 'joined',
      hideBelow: 'md',
      sortValue: (v) => v.joinedAt,
      cell: (v) => <span className="whitespace-nowrap text-ink-mute">{formatDate(v.joinedAt)}</span>,
    },
    {
      header: 'Status',
      id: 'status',
      sortValue: (v) => v.status,
      cell: (v) => (
        <Pill tone={tone[v.status]} dot>
          {label[v.status]}
        </Pill>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vendors"
        description={`${vendors.length} shops · ${count('pending')} awaiting review`}
        action={
          <>
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'vendors.csv',
                  ['studio', 'location', 'owner', 'pieces', 'rating', 'status', 'joined'],
                  rows.map((v) => [v.name, v.location, v.ownerEmail, pieces(v.id), v.rating, v.status, v.joinedAt.slice(0, 10)]),
                )
              }
            />
            <PrimaryLink to="/vendor/signup">Invite vendor</PrimaryLink>
          </>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        keyOf={(v) => v.id}
        empty="No shops match."
        toolbar={
          <TableToolbar
            end={
              <>
                <DensityToggle value={prefs.density} onChange={(density) => setPrefs((p) => ({ ...p, density }))} />
                <ColumnsMenu
                  options={[
                    { id: 'location', label: 'Location' },
                    { id: 'pieces', label: 'Pieces' },
                    { id: 'rating', label: 'Rating' },
                    { id: 'joined', label: 'Joined' },
                  ]}
                  hidden={prefs.hidden}
                  onChange={(hidden) => setPrefs((p) => ({ ...p, hidden }))}
                />
              </>
            }
          >
            <TableSearch value={search} onChange={setSearch} placeholder="Search shops" />
            <TableTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'All', count: vendors.length },
                { value: 'active', label: 'Active', count: count('active') },
                { value: 'pending', label: 'Pending', count: count('pending') },
                { value: 'suspended', label: 'Suspended', count: count('suspended') },
              ]}
            />
          </TableToolbar>
        }
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        density={prefs.density}
        hiddenColumns={prefs.hidden}
        defaultSort={{ id: 'joined', dir: 'desc' }}
        rowActions={[
          { label: 'View details', icon: LuEye, onClick: (v) => navigate(`/admin/vendors/${v.id}`) },
          {
            label: 'View storefront',
            icon: LuExternalLink,
            onClick: (v) => window.open(`/vendor/${v.slug}`, '_blank', 'noopener'),
            hidden: (v) => v.status !== 'active',
          },
          { label: 'Email owner', icon: LuMail, onClick: (v) => window.open(`mailto:${v.ownerEmail}`) },
          { label: 'Approve', icon: LuCircleCheck, onClick: (v) => change([v.id], 'active'), hidden: (v) => v.status !== 'pending' },
          { label: 'Reactivate', icon: LuRotateCcw, onClick: (v) => change([v.id], 'active'), hidden: (v) => v.status !== 'suspended' },
          {
            label: 'Suspend',
            icon: LuBan,
            danger: true,
            onClick: (v) => {
              if (confirm(`Suspend ${v.name}? Their storefront will be hidden.`)) change([v.id], 'suspended')
            },
            hidden: (v) => v.status === 'suspended',
          },
        ]}
        bulkBar={(keys, clear) => (
          <>
            <BulkButton
              icon={LuCircleCheck}
              onClick={() => {
                change(keys, 'active')
                clear()
              }}
            >
              Approve
            </BulkButton>
            <BulkButton
              icon={LuBan}
              danger
              onClick={() => {
                change(keys, 'suspended')
                clear()
              }}
            >
              Suspend
            </BulkButton>
          </>
        )}
      />
    </div>
  )
}
