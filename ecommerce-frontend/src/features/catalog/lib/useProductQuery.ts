import { useMemo, useState } from 'react'
import type { Product } from '@/shared/types'

export type SortKey = 'featured' | 'new' | 'price-asc' | 'price-desc' | 'rating'

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'new', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
]

export interface ProductFilters {
  categories: string[]
  vendorIds: string[]
  tags: string[]
  maxPrice: number
  minRating: number
  onSale: boolean
}

export const emptyFilters: ProductFilters = {
  categories: [],
  vendorIds: [],
  tags: [],
  maxPrice: 0,
  minRating: 0,
  onSale: false,
}

export function useProductQuery(source: Product[], initial?: Partial<ProductFilters>, pageSize = 12) {
  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(100, ...source.map((p) => p.price)) / 50) * 50,
    [source],
  )

  const [filters, setFilters] = useState<ProductFilters>({
    ...emptyFilters,
    maxPrice: priceCeiling,
    ...initial,
  })
  const [sort, setSort] = useState<SortKey>('featured')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const result = source.filter((p) => {
      if (filters.categories.length && !filters.categories.includes(p.category)) return false
      if (filters.vendorIds.length && !filters.vendorIds.includes(p.vendorId)) return false
      if (filters.tags.length && !filters.tags.some((t) => p.tags.includes(t))) return false
      if (filters.maxPrice && p.price > filters.maxPrice) return false
      if (filters.minRating && p.rating < filters.minRating) return false
      if (filters.onSale && !(p.originalPrice && p.originalPrice > p.price)) return false
      return true
    })

    switch (sort) {
      case 'price-asc':
        return [...result].sort((a, b) => a.price - b.price)
      case 'price-desc':
        return [...result].sort((a, b) => b.price - a.price)
      case 'rating':
        return [...result].sort((a, b) => b.rating - a.rating)
      case 'new':
        return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      default:
        return [...result].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false))
    }
  }, [source, filters, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const update = (patch: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  const reset = () => {
    setFilters({ ...emptyFilters, maxPrice: priceCeiling })
    setPage(1)
  }

  const activeCount =
    filters.categories.length +
    filters.vendorIds.length +
    filters.tags.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.maxPrice < priceCeiling ? 1 : 0)

  return {
    filters,
    update,
    reset,
    activeCount,
    priceCeiling,
    sort,
    setSort: (next: SortKey) => {
      setSort(next)
      setPage(1)
    },
    results: filtered,
    pageItems,
    page: currentPage,
    totalPages,
    setPage,
  }
}
