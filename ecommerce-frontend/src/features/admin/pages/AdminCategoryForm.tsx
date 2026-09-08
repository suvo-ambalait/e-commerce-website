import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/primitives'
import { Button, Field, ImageUploader, Input, Textarea } from '@/shared/ui'
import { imageFor } from '@/shared/lib/image'
import { useToast } from '@/shared/ui/Toast'
import { useCatalog } from '@/features/catalog/context/CatalogContext'

export function AdminCategoryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, addCategory, updateCategory } = useCatalog()
  const { notify } = useToast()

  const existing = id ? categories.find((c) => c.id === id) : undefined
  const editing = Boolean(id)

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    image: existing?.image ?? '',
  })

  if (editing && !existing) return <p className="text-sm text-ink-mute">Category not found.</p>

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      description: form.description,
      image: form.image || imageFor(form.name, `cat-${form.name}`, { w: 900, h: 1100 }),
    }
    if (editing && existing) {
      updateCategory(existing.id, payload)
      notify('Category updated', 'success')
    } else {
      addCategory(payload)
      notify('Category created', 'success')
    }
    navigate('/admin/categories')
  }

  return (
    <div className="space-y-5">
      <PageHeader title={editing ? 'Edit category' : 'New category'} />
      <form onSubmit={submit} className="max-w-xl space-y-5 rounded-lg border border-border bg-surface p-6">
        <Field label="Name" required>
          {(fid) => <Input id={fid} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label="Description" required>
          {(fid) => (
            <Textarea
              id={fid}
              required
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          )}
        </Field>
        <div>
          <p className="mb-1.5 text-caption font-medium tracking-wide text-ink-soft">Image</p>
          <div className="max-w-xs">
            <ImageUploader
              max={1}
              aspect="aspect-[4/3]"
              value={form.image ? [form.image] : []}
              onChange={(next) => setForm({ ...form, image: next[0] ?? '' })}
            />
          </div>
          <p className="mt-1 text-caption text-ink-mute">Leave blank to auto-generate.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/categories')}>
            Cancel
          </Button>
          <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </div>
  )
}
