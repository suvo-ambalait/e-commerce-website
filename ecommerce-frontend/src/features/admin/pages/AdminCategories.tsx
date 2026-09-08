import { Link, useNavigate } from 'react-router-dom'
import { PageHeader, DataTable, type Column } from '../components/primitives'
import { Button } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'
import type { Category } from '@/shared/types'

export function AdminCategories() {
  const navigate = useNavigate()
  const { categories, products, deleteCategory } = useCatalog()
  const { notify } = useToast()

  const columns: Column<Category>[] = [
    {
      header: 'Category',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <img src={c.image} alt="" className="h-10 w-10 rounded-sm object-cover" />
          <span className="font-medium text-ink">{c.name}</span>
        </div>
      ),
    },
    { header: 'Description', cell: (c) => <span className="line-clamp-1">{c.description}</span>, hideBelow: 'md' },
    { header: 'Products', cell: (c) => products.filter((p) => p.category === c.name).length, hideBelow: 'sm' },
    {
      header: '',
      className: 'text-right',
      cell: (c) => (
        <div className="flex justify-end gap-3">
          <Link to={`/admin/categories/${c.id}/edit`} className="text-caption text-accent hover:underline">
            Edit
          </Link>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete “${c.name}”?`)) {
                deleteCategory(c.id)
                notify('Category deleted')
              }
            }}
            className="text-caption text-ink-mute hover:text-danger"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description={`${categories.length} departments`}
        action={
          <Button size="sm" onClick={() => navigate('/admin/categories/new')}>
            Add category
          </Button>
        }
      />
      <DataTable rows={categories} columns={columns} keyOf={(c) => c.id} />
    </div>
  )
}
