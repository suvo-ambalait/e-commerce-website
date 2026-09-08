import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, Container, EmptyState, Input, Section } from '@/shared/ui'
import { useCatalog } from '../context/CatalogContext'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { ProductGrid } from '../components/ProductGrid'
import { VendorCard } from '@/features/vendor/components/VendorCard'

export function SearchPage() {
  const { products } = useCatalog()
  const { activeVendors, getVendor } = useVendors()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [input, setInput] = useState(query)

  useDocumentTitle(query ? `“${query}” · Search` : 'Search · MorerDokan')

  const q = query.trim().toLowerCase()

  const productHits = useMemo(() => {
    if (!q) return []
    return products.filter((p) => {
      const vendorName = getVendor(p.vendorId)?.name.toLowerCase() ?? ''
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        vendorName.includes(q)
      )
    })
  }, [q, products, getVendor])

  const vendorHits = useMemo(() => {
    if (!q) return []
    return activeVendors.filter(
      (v) => v.name.toLowerCase().includes(q) || v.tagline.toLowerCase().includes(q),
    )
  }, [q, activeVendors])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setParams(input.trim() ? { q: input.trim() } : {})
  }

  return (
    <Section size="sm">
      <Container>
        <h1 className="text-3xl text-ink">Search</h1>
        <form onSubmit={submit} className="mt-4 flex max-w-xl gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Makers, materials, pieces…" autoFocus />
          <Button type="submit" className="shrink-0">
            Search
          </Button>
        </form>

        {query && (
          <p className="mt-4 text-sm text-ink-mute">
            {productHits.length + vendorHits.length} results for “{query}”
          </p>
        )}

        {query && productHits.length === 0 && vendorHits.length === 0 && (
          <EmptyState
            className="mt-10"
            title={`Nothing for “${query}”`}
            description="Try a material (‘brass’, ‘linen’), a room, or a maker’s name."
          />
        )}

        {vendorHits.length > 0 && (
          <div className="mt-10">
            <h2 className="text-caption font-medium uppercase tracking-wide text-ink-mute">Makers</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {vendorHits.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          </div>
        )}

        {productHits.length > 0 && (
          <div className="mt-10">
            <h2 className="text-caption font-medium uppercase tracking-wide text-ink-mute">Pieces</h2>
            <ProductGrid products={productHits} className="mt-4" />
          </div>
        )}
      </Container>
    </Section>
  )
}
