import type { Category } from '@/shared/types'
import { imageFor } from '@/shared/lib/image'

interface Seed {
  id: string
  name: string
  slug: string
  description: string
}

const seeds: Seed[] = [
  { id: 'lighting', name: 'Lighting', slug: 'lighting', description: 'Table, floor and pendant lighting from independent makers.' },
  { id: 'tableware', name: 'Tableware', slug: 'tableware', description: 'Hand-thrown plates, bowls and drinkware for daily use.' },
  { id: 'furniture', name: 'Furniture', slug: 'furniture', description: 'Solid-timber seating, tables and storage built to be repaired.' },
  { id: 'textiles', name: 'Textiles', slug: 'textiles', description: 'Naturally dyed throws, cushions and table linen.' },
  { id: 'stationery', name: 'Stationery', slug: 'stationery', description: 'Notebooks, pens and desk objects in small batches.' },
  { id: 'bath-body', name: 'Bath & Body', slug: 'bath-body', description: 'Soap, oils and towels formulated with steam-distilled botanicals.' },
  { id: 'plants-fragrance', name: 'Plants & Fragrance', slug: 'plants-fragrance', description: 'Potted foliage plants and hand-poured candles.' },
  { id: 'decor', name: 'Decor', slug: 'decor', description: 'Objects, mirrors and wall pieces to finish a room.' },
]

export const seedCategories: Category[] = seeds.map((s) => ({
  ...s,
  image: imageFor(s.name, `cat-${s.id}`, { w: 900, h: 1100 }),
}))
