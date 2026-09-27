import { useState, type FormEvent } from 'react'
import { LuEye, LuFileText, LuImage, LuLayers, LuPackage, LuPercent, LuTag } from 'react-icons/lu'
import { Button, Field, ImageUploader, Input, Select, Switch, Textarea } from '@/shared/ui'
import { galleryFor } from '@/shared/lib/image'
import type { Product, ProductStatus } from '@/shared/types'
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
  status: ProductStatus
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
    status: p?.status ?? 'active',
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
      status: form.status,
      createdAt: product?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem] xl:items-start">
      {/* main column */}
      <div className="space-y-4">
        <Section icon={<LuFileText className="h-4 w-4" />} title="Details">
          <div className="grid gap-4">
            <Field label="Name" required>
              {(id) => <Input id={id} required value={form.name} onChange={set('name')} placeholder="e.g. Halo Table Lamp" />}
            </Field>
            <Field label="Description" required>
              {(id) => (
                <Textarea
                  id={id}
                  required
                  rows={4}
                  value={form.description}
                  onChange={set('description')}
                  placeholder="What it is, how it’s made, how it feels to use."
                />
              )}
            </Field>
            <Field label="Materials" required>
              {(id) => (
                <Input id={id} required value={form.materials} onChange={set('materials')} placeholder="Solid oak, hardwax oil" />
              )}
            </Field>
            <Field label="Tags" hint="Comma-separated — power the shop filters">
              {(id) => <Input id={id} value={form.tags} onChange={set('tags')} placeholder="bestseller, brass, gift" />}
            </Field>
          </div>
        </Section>

        <Section icon={<LuImage className="h-4 w-4" />} title="Photos" subtitle="Leave empty to auto-generate placeholders for this category.">
          <ImageUploader value={form.images} onChange={(next) => setForm((prev) => ({ ...prev, images: next }))} />
        </Section>

        <Section icon={<LuTag className="h-4 w-4" />} title="Pricing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (USD)" required>
              {(id) => (
                <Input id={id} type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} placeholder="0.00" />
              )}
            </Field>
            <Field label="Compare-at price" hint="Optional — shows a sale badge">
              {(id) => (
                <Input id={id} type="number" min="0" step="0.01" value={form.originalPrice} onChange={set('originalPrice')} placeholder="0.00" />
              )}
            </Field>
          </div>
          {Number(form.originalPrice) > Number(form.price) && Number(form.price) > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-2.5 py-1 text-caption font-semibold text-accent">
              <LuPercent className="h-3.5 w-3.5" />
              {Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)}% off will show in the shop
            </p>
          )}
        </Section>

        <Section icon={<LuPackage className="h-4 w-4" />} title="Inventory">
          {product ? (
            <ProductStockPanel product={product} />
          ) : (
            <Field label="Opening stock" required hint="Recorded as the first inventory movement">
              {(id) => <Input id={id} type="number" min="0" required value={form.stock} onChange={set('stock')} />}
            </Field>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
        </Section>
      </div>

      {/* side column */}
      <div className="space-y-4 xl:sticky xl:top-6">
        <Section icon={<LuEye className="h-4 w-4" />} title="Visibility">
          <Field label="Status">
            {(id) => (
              <Select
                id={id}
                value={form.status}
                onChange={(v) => setField('status', v)}
                options={[
                  { value: 'active', label: 'Active', hint: 'Visible in the shop' },
                  { value: 'draft', label: 'Draft', hint: 'Hidden until you publish' },
                  ...(product?.status === 'archived' ? [{ value: 'archived', label: 'Archived', hint: 'Hidden and out of lists' }] : []),
                ]}
              />
            )}
          </Field>
          <div className="mt-4 rounded-xl border border-border p-3">
            <Switch
              checked={form.featured}
              onChange={(v) => setField('featured', v)}
              label={<span className="text-sm font-medium text-ink">Feature on the homepage</span>}
            />
          </div>
        </Section>

        <Section icon={<LuLayers className="h-4 w-4" />} title="Organisation">
          <div className="grid gap-4">
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
        </Section>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
        <div>
          <h3 className="font-display! text-base font-bold! tracking-[-0.01em]! text-ink">{title}</h3>
          {subtitle && <p className="text-caption text-ink-mute">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
