import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedState } from '@/shared/hooks/usePersistedState'
import { storageKeys } from '@/shared/lib/storage'
import { slugify } from '@/shared/lib/slug'
import type { Category, Product, Review } from '@/shared/types'
import { seedProducts } from '../data/products'
import { seedCategories } from '../data/categories'
import { seedReviews } from '../data/reviews'

export type ProductInput = Omit<Product, 'id' | 'slug' | 'sku'>

interface CatalogContextValue {
  products: Product[]
  categories: Category[]
  reviews: Review[]
  getProduct: (id: string) => Product | undefined
  getProductBySlug: (slug: string) => Product | undefined
  productsByVendor: (vendorId: string) => Product[]
  reviewsFor: (productId: string) => Review[]
  addReview: (review: Omit<Review, 'id' | 'date'>) => void
  addProduct: (input: ProductInput) => Product
  updateProduct: (id: string, input: ProductInput) => void
  patchProduct: (id: string, patch: Partial<Product>) => void
  deleteProduct: (id: string) => void
  addCategory: (input: Omit<Category, 'id' | 'slug'>) => void
  updateCategory: (id: string, input: Omit<Category, 'id' | 'slug'>) => void
  deleteCategory: (id: string) => void
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = usePersistedState<Product[]>(storageKeys.products, seedProducts)
  const [categories, setCategories] = usePersistedState<Category[]>(storageKeys.categories, seedCategories)
  const [reviews, setReviews] = usePersistedState<Review[]>(storageKeys.reviews, seedReviews)

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products])
  const getProductBySlug = useCallback((slug: string) => products.find((p) => p.slug === slug), [products])
  const productsByVendor = useCallback(
    (vendorId: string) => products.filter((p) => p.vendorId === vendorId),
    [products],
  )
  const reviewsFor = useCallback(
    (productId: string) => reviews.filter((r) => r.productId === productId),
    [reviews],
  )

  const addReview = useCallback<CatalogContextValue['addReview']>(
    (review) =>
      setReviews((prev) => [
        { ...review, id: `r-${Date.now().toString(36)}`, date: new Date().toISOString() },
        ...prev,
      ]),
    [setReviews],
  )

  const addProduct = useCallback<CatalogContextValue['addProduct']>(
    (input) => {
      const id = `p-${Date.now().toString(36)}`
      const product: Product = { ...input, id, slug: slugify(input.name) || id, sku: `SKU-${id.toUpperCase()}` }
      setProducts((prev) => [product, ...prev])
      return product
    },
    [setProducts],
  )

  const updateProduct = useCallback<CatalogContextValue['updateProduct']>(
    (id, input) =>
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...input, id, slug: slugify(input.name) || p.slug } : p)),
      ),
    [setProducts],
  )

  const patchProduct = useCallback<CatalogContextValue['patchProduct']>(
    (id, patch) => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, id } : p))),
    [setProducts],
  )

  const deleteProduct = useCallback(
    (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id)),
    [setProducts],
  )

  const addCategory = useCallback<CatalogContextValue['addCategory']>(
    (input) => {
      const id = `c-${Date.now().toString(36)}`
      setCategories((prev) => [...prev, { ...input, id, slug: slugify(input.name) || id }])
    },
    [setCategories],
  )

  const updateCategory = useCallback<CatalogContextValue['updateCategory']>(
    (id, input) =>
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...input, id, slug: slugify(input.name) || c.slug } : c)),
      ),
    [setCategories],
  )

  const deleteCategory = useCallback(
    (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id)),
    [setCategories],
  )

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      categories,
      reviews,
      getProduct,
      getProductBySlug,
      productsByVendor,
      reviewsFor,
      addReview,
      addProduct,
      updateProduct,
      patchProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [
      products, categories, reviews, getProduct, getProductBySlug, productsByVendor, reviewsFor,
      addReview, addProduct, updateProduct, patchProduct, deleteProduct, addCategory, updateCategory, deleteCategory,
    ],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider')
  return ctx
}
