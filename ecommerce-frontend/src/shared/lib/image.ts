/**
 * Curated Unsplash imagery.
 *
 * Placeholder photo services return random or poorly-matched shots, which reads
 * as broken on a design marketplace. Instead we hand-pick a small pool of real
 * Unsplash photos per department and assign them deterministically, so a lamp
 * looks like a lamp and the same product always shows the same picture.
 */

const CDN = 'https://images.unsplash.com/photo-'

/** verified, long-lived Unsplash photo ids, grouped by department */
const POOLS: Record<string, string[]> = {
  Lighting: [
    '1517705008128-361805f42e86',
    '1507473885765-e6ed057f782c',
    '1540932239986-30128078f3c5',
    '1524758631624-e2822e304c36',
    '1591123720164-de1348028a51',
    '1519710164239-da123dc03ef4',
  ],
  Tableware: [
    '1578749556568-bc2c40e68b61',
    '1584100936595-c0654b55a2e6',
    '1589365278144-c9e705f843ba',
    '1584589167171-541ce45f1eea',
    '1493663284031-b7e3aefcae8e',
  ],
  Furniture: [
    '1555041469-a586c61ea9bc',
    '1567538096630-e0c55bd6374c',
    '1538688525198-9b88f6f53126',
    '1503602642458-232111445657',
    '1550581190-9c1c48d21d6c',
    '1594026112284-02bb6f3352fe',
    '1596162954151-cdcb4c0f70a8',
    '1567016432779-094069958ea5',
    '1519961655809-34fa156820ff',
  ],
  Textiles: [
    '1600166898405-da9535204843',
    '1616627561839-074385245ff6',
    '1522758971460-1d21eed7dc1d',
    '1620799140408-edc6dcb6d633',
    '1578500494198-246f612d3b3d',
  ],
  Stationery: [
    '1531346878377-a5be20888e57',
    '1455390582262-044cdead277a',
    '1513542789411-b6a5d4f31634',
    '1544816155-12df9643f363',
    '1517971129774-8a2b38fa128e',
  ],
  'Bath & Body': [
    '1568871391149-8b3f4c3f4c1b',
    '1556228578-8c89e6adf883',
    '1584305574647-0cc949a2bb9f',
    '1601049676869-702ea24cfd58',
    '1596755389378-c31d21fd1273',
  ],
  'Plants & Fragrance': [
    '1485955900006-10f4d324d411',
    '1466781783364-36c955e42a7f',
    '1493957988430-a5f2e15f39a3',
    '1509937528035-ad76254b0356',
  ],
  Decor: [
    '1602028915047-37269d1a73f7',
    '1583847268964-b28dc8f51f92',
    '1533090161767-e6ffed986c88',
    '1616486338812-3dadae4b4ace',
  ],
  Studio: [
    '1524230572899-a752b3835840',
    '1594026112284-02bb6f3352fe',
    '1517971129774-8a2b38fa128e',
    '1538688525198-9b88f6f53126',
  ],
}

const CROPS = ['entropy', 'edges', 'top', 'bottom']

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h)
}

function url(id: string, w: number, h: number, crop = 'entropy'): string {
  return `${CDN}${id}?w=${w}&h=${h}&fit=crop&crop=${crop}&q=75&auto=format`
}

function pool(department: string): string[] {
  return POOLS[department] ?? POOLS.Decor
}

/** Single deterministic image for a seed within a department. */
export function imageFor(
  department: string,
  seed: string,
  { w = 900, h = 1125 }: { w?: number; h?: number } = {},
): string {
  const p = pool(department)
  return url(p[hash(seed) % p.length], w, h)
}

/** A 4-shot gallery — distinct photos from the department, wrapping if the pool is small. */
export function galleryFor(seed: string, department: string, count = 4): string[] {
  const p = pool(department)
  const start = hash(seed) % p.length
  return Array.from({ length: count }, (_, i) =>
    url(p[(start + i) % p.length], 1100, 1375, CROPS[i % CROPS.length]),
  )
}

export function bannerFor(seed: string, department: string): string {
  const p = pool(department === 'Studio' ? 'Studio' : department)
  return url(p[hash(`${seed}b`) % p.length], 1920, 720, 'entropy')
}

export function avatarFor(seed: string, department: string): string {
  const p = pool(department)
  return url(p[hash(`${seed}m`) % p.length], 240, 240, 'entropy')
}

/** Department resolver for category names → pool key. */
export function keywordsForCategory(category: string): string {
  return category
}
