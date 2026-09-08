import { useState, type FormEvent } from 'react'
import { Button, Field, ImageUploader, Input, Select, Textarea } from '@/shared/ui'
import { galleryFor } from '@/shared/lib/image'
import type { Product } from '@/shared/types'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { ProductStockPanel } from '@/features/inventory/components/ProductStockPanel'
import { useCatalog, type ProductInput } from '../context/CatalogContext'

interface Props {
  product?: Product
  vendorId: string
  lockVendor?: boolean
  onSubmit: (input: ProductInput) => void
  onCancel: () => void
}

type FormState = {
  name: string
  description: string
  price: string
  originalPrice: string
  category: string
  vendorId: string
  images: string[]
  stock: string
  reorderPoint: string
  rating: string
  reviewCount: string
  materials: string
  tags: string
  featured: boolean
}

function toState(p: Product | undefined, vendorId: string): FormState {
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    price: p ? String(p.price) : '',
    originalPrice: p?.originalPrice != null ? String(p.originalPrice) : '',
    category: p?.category ?? '',
    vendorId: p?.vendorId ?? vendorId,
    images: p?.images ?? [],
    stock: p ? String(p.stock) : '0',
    reorderPoint: p?.reorderPoint != null ? String(p.reorderPoint) : '',
    rating: p ? String(p.rating) : '4.6',
    reviewCount: p ? String(p.reviewCount) : '0',
    materials: p?.materials ?? '',
    tags: (p?.tags ?? []).join(', '),
    featured: p?.featured ?? false,
  }
}

export function ProductForm({ product, vendorId, lockVendor, onSubmit, onCancel }: Props) {
  const { categories } = useCatalog()
  const { vendors } = useVendors()
  const [form, setForm] = useState<FormState>(() => toState(product, vendorId))

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = key === 'featured' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  const setField = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const images = form.images.filter(Boolean)
    onSubmit({
      name: form.name,
      description: form.description,
      price: Number(form.price) || 0,
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      category: form.category,
      vendorId: form.vendorId,
      images: images.length
        ? images
        : galleryFor(form.name || 'new-product', form.category),
      stock: product ? product.stock : Number(form.stock) || 0,
      reorderPoint: form.reorderPoint === '' ? undefined : Math.max(0, Number(form.reorderPoint)),
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
      materials: form.materials,
      tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      featured: form.featured,
      createdAt: product?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-lg border border-border bg-surface p-6">
      <Field label="Name" required>
        {(id) => <Input id={id} required value={form.name} onChange={set('name')} />}
      </Field>
      <Field label="Description" required>
        {(id) => <Textarea id={id} required rows={3} value={form.description} onChange={set('description')} />}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Price (USD)" required>
          {(id) => <Input id={id} type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} />}
        </Field>
        <Field label="Compare-at price" hint="Optional — shows a sale badge">
          {(id) => <Input id={id} type="number" min="0" step="0.01" value={form.originalPrice} onChange={set('originalPrice')} />}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" required>
          {(id) => (
            <Select
              id={id}
              value={form.category}
              onChange={(v) => setField('category', v)}
              placeholder="Choose a category…"
              options={categories.map((c) => ({ value: c.name, label: c.name }))}
            />
          )}
        </Field>
        <Field label="Maker">
          {(id) => (
            <Select
              id={id}
              value={form.vendorId}
              onChange={(v) => setField('vendorId', v)}
              disabled={lockVendor}
              options={vendors.map((v) => ({ value: v.id, label: v.name }))}
            />
          )}
        </Field>
      </div>

      {product ? (
        <ProductStockPanel product={product} />
      ) : (
        <Field label="Opening stock" required hint="Recorded as the first inventory movement">
          {(id) => <Input id={id} type="number" min="0" required value={form.stock} onChange={set('stock')} />}
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Reorder point" hint="Blank = store default">
          {(id) => <Input id={id} type="number" min="0" value={form.reorderPoint} onChange={set('reorderPoint')} />}
        </Field>
        <Field label="Rating">
          {(id) => <Input id={id} type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set('rating')} />}
        </Field>
        <Field label="Review count">
          {(id) => <Input id={id} type="number" min="0" value={form.reviewCount} onChange={set('reviewCount')} />}
        </Field>
      </div>

      <Field label="Materials" required>
        {(id) => <Input id={id} required value={form.materials} onChange={set('materials')} placeholder="Solid oak, hardwax oil" />}
      </Field>
      <Field label="Tags" hint="Comma-separated — power the shop filters">
        {(id) => <Input id={id} value={form.tags} onChange={set('tags')} placeholder="bestseller, brass, gift" />}
      </Field>
      <div>
        <p className="mb-1.5 text-caption font-medium tracking-wide text-ink-soft">Photos</p>
        <ImageUploader
          value={form.images}
          onChange={(next) => setForm((prev) => ({ ...prev, images: next }))}
        />
        <p className="mt-1 text-caption text-ink-mute">Leave empty to auto-generate placeholders for this category.</p>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" checked={form.featured} onChange={set('featured')} className="h-4 w-4 accent-accent" />
        Feature on the MorerDokan homepage
      </label>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{product ? 'Save changes' : 'Create product'}</Button>
      </div>
    </form>
  )
}
