import type { Product } from '@/shared/types'
import { galleryFor } from '@/shared/lib/image'
import { slugify } from '@/shared/lib/slug'

interface Seed {
  id: string
  name: string
  /** reserved for future image-search tuning; not currently used */
  kw?: string
  vendorId: string
  category: string
  price: number
  originalPrice?: number
  description: string
  materials: string
  tags: string[]
  rating: number
  reviewCount: number
  stock: number
  featured?: boolean
  createdAt: string
}

function build({ kw: _kw, ...seed }: Seed): Product {
  return {
    ...seed,
    slug: slugify(seed.name),
    images: galleryFor(seed.id, seed.category),
    sku: `${seed.vendorId.replace('v-', '').toUpperCase().slice(0, 3)}-${seed.id.replace(/\D/g, '').padStart(4, '0')}`,
  }
}

const seeds: Seed[] = [
  // ---------------------------------------------------------------- Lumen Atelier
  {
    id: 'p1', name: 'Halo Table Lamp', kw: 'table lamp', vendorId: 'v-lumen', category: 'Lighting',
    price: 289, originalPrice: 340,
    description: 'An opal glass sphere on a hand-spun brass stem that throws a soft, even glow.',
    materials: 'Mouth-blown opal glass, patinated brass, dimmable LED',
    tags: ['bestseller', 'dimmable', 'brass'], rating: 4.9, reviewCount: 214, stock: 12, featured: true,
    createdAt: '2024-11-02',
  },
  {
    id: 'p2', name: 'Column Floor Light', kw: 'floor lamp', vendorId: 'v-lumen', category: 'Lighting',
    price: 545,
    description: 'A slender ribbed-glass column that reads as a piece of architecture when lit.',
    materials: 'Ribbed borosilicate glass, blackened steel base',
    tags: ['statement', 'floor'], rating: 4.8, reviewCount: 63, stock: 6, featured: true,
    createdAt: '2025-01-19',
  },
  {
    id: 'p3', name: 'Paper Pendant, Small', kw: 'pendant light', vendorId: 'v-lumen', category: 'Lighting',
    price: 165,
    description: 'A folded washi pendant that packs flat and opens into a faceted lantern.',
    materials: 'Japanese washi paper, ash veneer ring',
    tags: ['pendant', 'lightweight'], rating: 4.7, reviewCount: 128, stock: 40,
    createdAt: '2024-08-11',
  },
  {
    id: 'p4', name: 'Disc Wall Sconce', kw: 'wall sconce', vendorId: 'v-lumen', category: 'Lighting',
    price: 210, originalPrice: 245,
    description: 'A brass disc that bounces light off the wall for a low, warm wash.',
    materials: 'Solid brass, frosted acrylic diffuser',
    tags: ['wall', 'brass', 'sale'], rating: 4.9, reviewCount: 47, stock: 18,
    createdAt: '2025-02-08',
  },
  {
    id: 'p5', name: 'Pebble Rechargeable Lamp', kw: 'lamp', vendorId: 'v-lumen', category: 'Lighting',
    price: 129,
    description: 'A cordless table light the size of a river stone, good for six hours off the dock.',
    materials: 'Cast ceramic, silicone base, USB-C',
    tags: ['portable', 'cordless', 'new'], rating: 4.6, reviewCount: 92, stock: 55, featured: true,
    createdAt: '2025-03-01',
  },
  {
    id: 'p6', name: 'Arc Reading Light', kw: 'reading lamp', vendorId: 'v-lumen', category: 'Lighting',
    price: 320,
    description: 'A counter-weighted arc that reaches over an armchair without a floor base in the way.',
    materials: 'Powder-coated aluminium, marble counterweight',
    tags: ['reading', 'adjustable'], rating: 4.8, reviewCount: 38, stock: 9,
    createdAt: '2024-12-14',
  },

  // ---------------------------------------------------------------- Terra & Form
  {
    id: 'p7', name: 'Everyday Mug, Set of 2', kw: 'coffee mug', vendorId: 'v-terra', category: 'Tableware',
    price: 48,
    description: 'A twelve-ounce mug with a full-finger handle and a glaze that pools at the base.',
    materials: 'Stoneware, food-safe reactive glaze',
    tags: ['bestseller', 'dishwasher-safe', 'set'], rating: 4.8, reviewCount: 340, stock: 64, featured: true,
    createdAt: '2024-09-20',
  },
  {
    id: 'p8', name: 'Dinner Plate', kw: 'dinner plate', vendorId: 'v-terra', category: 'Tableware',
    price: 32,
    description: 'A ten-inch plate with enough weight that it stays put while you eat.',
    materials: 'Stoneware, matte oatmeal glaze',
    tags: ['dinnerware'], rating: 4.7, reviewCount: 210, stock: 120,
    createdAt: '2024-09-20',
  },
  {
    id: 'p9', name: 'Serving Bowl, Large', kw: 'ceramic bowl', vendorId: 'v-terra', category: 'Tableware',
    price: 74, originalPrice: 92,
    description: 'A wide, shallow bowl for pasta, salad or fruit on the counter.',
    materials: 'Stoneware, speckled ash glaze',
    tags: ['serving', 'sale'], rating: 4.9, reviewCount: 88, stock: 22, featured: true,
    createdAt: '2024-10-30',
  },
  {
    id: 'p10', name: 'Tumbler, Set of 4', kw: 'drinking glass', vendorId: 'v-terra', category: 'Tableware',
    price: 68,
    description: 'A short, faceted tumbler for water or wine that feels good to hold.',
    materials: 'Stoneware, clear glaze',
    tags: ['set', 'drinkware'], rating: 4.6, reviewCount: 132, stock: 40,
    createdAt: '2025-01-05',
  },
  {
    id: 'p11', name: 'Salt Cellar', kw: 'ceramic pot', vendorId: 'v-terra', category: 'Tableware',
    price: 24,
    description: 'A lidless pinch pot that lives next to the stove.',
    materials: 'Stoneware, unglazed exterior',
    tags: ['kitchen', 'new'], rating: 4.5, reviewCount: 54, stock: 88,
    createdAt: '2025-02-22',
  },
  {
    id: 'p12', name: 'Vase, Tall', kw: 'ceramic vase', vendorId: 'v-terra', category: 'Decor',
    price: 96,
    description: 'A narrow-necked vase that holds a single branch or a loose market bunch.',
    materials: 'Stoneware, iron-rich clay body',
    tags: ['vase', 'decor'], rating: 4.8, reviewCount: 71, stock: 16, featured: true,
    createdAt: '2024-11-28',
  },

  // ---------------------------------------------------------------- Halden Woodworks
  {
    id: 'p13', name: 'Spindle Dining Chair', kw: 'wooden chair', vendorId: 'v-halden', category: 'Furniture',
    price: 480,
    description: 'A light, strong chair with a steam-bent back and hand-shaped seat.',
    materials: 'Solid white oak, hardwax oil finish',
    tags: ['seating', 'bestseller'], rating: 4.9, reviewCount: 96, stock: 14, featured: true,
    createdAt: '2024-07-15',
  },
  {
    id: 'p14', name: 'Two-Drawer Side Table', kw: 'nightstand', vendorId: 'v-halden', category: 'Furniture',
    price: 640, originalPrice: 720,
    description: 'A bedside table with hand-cut dovetails and a shelf for the books you are mid-way through.',
    materials: 'Solid walnut, brass pulls',
    tags: ['storage', 'sale'], rating: 4.8, reviewCount: 41, stock: 7,
    createdAt: '2024-10-02',
  },
  {
    id: 'p15', name: 'Low Bench', kw: 'wooden bench', vendorId: 'v-halden', category: 'Furniture',
    price: 390,
    description: 'A hallway bench for pulling boots on, sized to sit under a window.',
    materials: 'Solid ash, wedged through-tenons',
    tags: ['seating', 'entryway'], rating: 4.9, reviewCount: 33, stock: 10, featured: true,
    createdAt: '2025-01-27',
  },
  {
    id: 'p16', name: 'Wall Peg Rail', kw: 'coat rack', vendorId: 'v-halden', category: 'Furniture',
    price: 120,
    description: 'A turned-peg rail for coats, bags, or a hanging plant by the door.',
    materials: 'Solid oak, keyhole mounts',
    tags: ['storage', 'wall'], rating: 4.7, reviewCount: 58, stock: 30,
    createdAt: '2024-12-09',
  },
  {
    id: 'p17', name: 'Stacking Stool', kw: 'wooden stool', vendorId: 'v-halden', category: 'Furniture',
    price: 175,
    description: 'A three-legged stool that works as extra seating or a side surface, and stacks away.',
    materials: 'Solid birch, oil finish',
    tags: ['seating', 'new', 'stackable'], rating: 4.6, reviewCount: 27, stock: 24,
    createdAt: '2025-02-18',
  },
  {
    id: 'p18', name: 'Writing Desk', kw: 'writing desk', vendorId: 'v-halden', category: 'Furniture',
    price: 980,
    description: 'A compact desk with a single wide drawer and a cable channel along the back.',
    materials: 'Solid oak, blackened steel legs',
    tags: ['desk', 'workspace'], rating: 4.9, reviewCount: 19, stock: 4,
    createdAt: '2024-11-11',
  },

  // ---------------------------------------------------------------- Loomstate
  {
    id: 'p19', name: 'Indigo Handwoven Throw', kw: 'wool blanket', vendorId: 'v-loomstate', category: 'Textiles',
    price: 168, originalPrice: 195,
    description: 'A pedal-loom throw in churro wool, dip-dyed in a natural indigo vat.',
    materials: 'Churro wool, natural indigo, hand-knotted fringe',
    tags: ['bestseller', 'sale', 'wool'], rating: 4.8, reviewCount: 176, stock: 20, featured: true,
    createdAt: '2024-08-30',
  },
  {
    id: 'p20', name: 'Cochineal Cushion Cover', kw: 'throw pillow', vendorId: 'v-loomstate', category: 'Textiles',
    price: 62,
    description: 'An 18-inch cushion cover in a soft rose from cochineal, with a hidden zip.',
    materials: 'Organic cotton, cochineal dye',
    tags: ['cushion'], rating: 4.7, reviewCount: 121, stock: 44,
    createdAt: '2024-09-14',
  },
  {
    id: 'p21', name: 'Marigold Table Runner', kw: 'table runner', vendorId: 'v-loomstate', category: 'Textiles',
    price: 78,
    description: 'A long runner in warm yellow from marigold flowers, with a subtle weft stripe.',
    materials: 'Organic cotton, marigold dye',
    tags: ['table-linen', 'new'], rating: 4.6, reviewCount: 44, stock: 33,
    createdAt: '2025-02-03',
  },
  {
    id: 'p22', name: 'Wool Floor Cushion', kw: 'floor cushion', vendorId: 'v-loomstate', category: 'Textiles',
    price: 145,
    description: 'A firm, kilim-topped floor cushion for extra seating around a low table.',
    materials: 'Handwoven wool top, cotton canvas base, kapok fill',
    tags: ['floor', 'seating'], rating: 4.7, reviewCount: 63, stock: 15, featured: true,
    createdAt: '2024-12-01',
  },
  {
    id: 'p23', name: 'Striped Hand Towel, Pair', kw: 'hand towel', vendorId: 'v-loomstate', category: 'Textiles',
    price: 54,
    description: 'A quick-drying waffle-weave towel with a hanging loop, sold as a pair.',
    materials: 'Organic cotton waffle weave',
    tags: ['bath', 'set'], rating: 4.5, reviewCount: 98, stock: 60,
    createdAt: '2025-01-12',
  },
  {
    id: 'p24', name: 'Wool Lumbar Pillow', kw: 'lumbar pillow', vendorId: 'v-loomstate', category: 'Textiles',
    price: 88,
    description: 'A long lumbar pillow with a geometric motif drawn from the workshop archive.',
    materials: 'Churro wool front, cotton back, feather insert',
    tags: ['cushion', 'wool'], rating: 4.8, reviewCount: 51, stock: 26,
    createdAt: '2024-10-19',
  },

  // ---------------------------------------------------------------- Fieldnote Supply
  {
    id: 'p25', name: 'Letterpress Notebook, A5', kw: 'notebook', vendorId: 'v-fieldnote', category: 'Stationery',
    price: 26,
    description: 'A lay-flat notebook with 160 numbered pages of 100gsm Swedish paper.',
    materials: '100gsm uncoated paper, letterpress cover, cloth spine',
    tags: ['bestseller', 'paper'], rating: 4.9, reviewCount: 612, stock: 200, featured: true,
    createdAt: '2024-06-04',
  },
  {
    id: 'p26', name: 'Machined Brass Pen', kw: 'fountain pen', vendorId: 'v-fieldnote', category: 'Stationery',
    price: 58, originalPrice: 68,
    description: 'A weighty pocket pen turned from solid brass that develops a patina with use.',
    materials: 'Solid brass, standard rollerball refill',
    tags: ['brass', 'sale', 'edc'], rating: 4.8, reviewCount: 288, stock: 75, featured: true,
    createdAt: '2024-07-22',
  },
  {
    id: 'p27', name: 'Desk Tray', kw: 'desk tray', vendorId: 'v-fieldnote', category: 'Stationery',
    price: 44,
    description: 'A shallow oak tray to corral pens, keys and the day’s small clutter.',
    materials: 'Solid white oak, felt base',
    tags: ['desk', 'organization'], rating: 4.7, reviewCount: 134, stock: 48,
    createdAt: '2024-11-05',
  },
  {
    id: 'p28', name: 'Weekly Planner Pad', kw: 'planner notebook', vendorId: 'v-fieldnote', category: 'Stationery',
    price: 18,
    description: 'An undated tear-off pad with a full week to a page and room for notes.',
    materials: 'Recycled paper, board backing',
    tags: ['planning', 'new'], rating: 4.6, reviewCount: 97, stock: 160,
    createdAt: '2025-02-10',
  },
  {
    id: 'p29', name: 'Card Set, Blank', kw: 'greeting card', vendorId: 'v-fieldnote', category: 'Stationery',
    price: 22,
    description: 'Eight letterpress cards and envelopes in a muted, use-anytime palette.',
    materials: 'Cotton card stock, letterpress print',
    tags: ['cards', 'gift'], rating: 4.8, reviewCount: 143, stock: 90,
    createdAt: '2024-12-16',
  },
  {
    id: 'p30', name: 'Leather Pen Roll', kw: 'leather pouch', vendorId: 'v-fieldnote', category: 'Stationery',
    price: 72,
    description: 'A vegetable-tanned pen roll that holds four pens and a small notebook.',
    materials: 'Vegetable-tanned leather, waxed thread',
    tags: ['leather', 'travel'], rating: 4.9, reviewCount: 61, stock: 20,
    createdAt: '2024-10-08',
  },

  // ---------------------------------------------------------------- Still Goods
  {
    id: 'p31', name: 'Hinoki Bath Oil', kw: 'oil bottle', vendorId: 'v-still', category: 'Bath & Body',
    price: 38,
    description: 'A few capfuls turns a bath into a cypress forest; skin-softening without a film.',
    materials: 'Steam-distilled hinoki, jojoba, sweet almond oil',
    tags: ['bestseller', 'fragrance'], rating: 4.7, reviewCount: 224, stock: 70, featured: true,
    createdAt: '2024-09-02',
  },
  {
    id: 'p32', name: 'Bar Soap, Set of 3', kw: 'bar soap', vendorId: 'v-still', category: 'Bath & Body',
    price: 30,
    description: 'A cold-process bar with a stable lather — charcoal, yuzu and plain, in one box.',
    materials: 'Olive and coconut oils, botanical extracts',
    tags: ['set', 'gift'], rating: 4.6, reviewCount: 318, stock: 110,
    createdAt: '2024-09-02',
  },
  {
    id: 'p33', name: 'Linen Bath Towel', kw: 'bath towel', vendorId: 'v-still', category: 'Bath & Body',
    price: 64, originalPrice: 78,
    description: 'A lightweight linen towel that dries fast and gets softer every wash.',
    materials: 'Stonewashed European linen',
    tags: ['bath', 'sale', 'linen'], rating: 4.5, reviewCount: 86, stock: 34,
    createdAt: '2024-11-20',
  },
  {
    id: 'p34', name: 'Hand Balm', kw: 'hand cream', vendorId: 'v-still', category: 'Bath & Body',
    price: 22,
    description: 'A non-greasy balm in a flat tin for pockets, bags and bedside tables.',
    materials: 'Shea butter, beeswax, chamomile',
    tags: ['everyday', 'new'], rating: 4.7, reviewCount: 155, stock: 140, featured: true,
    createdAt: '2025-01-30',
  },
  {
    id: 'p35', name: 'Bath Brush', kw: 'wooden brush', vendorId: 'v-still', category: 'Bath & Body',
    price: 34,
    description: 'A long-handled beechwood brush with tampico bristles for a proper scrub.',
    materials: 'Oiled beechwood, tampico fibre',
    tags: ['tools'], rating: 4.4, reviewCount: 47, stock: 40,
    createdAt: '2024-12-22',
  },
  {
    id: 'p36', name: 'Room Mist, Cedar', kw: 'spray bottle', vendorId: 'v-still', category: 'Plants & Fragrance',
    price: 28,
    description: 'A quick spritz of cedar and vetiver to reset a room between things.',
    materials: 'Distilled water, essential oils, plant-derived solubiliser',
    tags: ['fragrance'], rating: 4.5, reviewCount: 72, stock: 85,
    createdAt: '2025-02-14',
  },

  // ---------------------------------------------------------------- Fern & Flora
  {
    id: 'p37', name: 'Potted Fiddle-Leaf, Medium', kw: 'houseplant', vendorId: 'v-fern', category: 'Plants & Fragrance',
    price: 85,
    description: 'A well-established plant about 70cm tall, shipped in a plain terracotta pot.',
    materials: 'Live Ficus lyrata, terracotta pot, coir mix',
    tags: ['plant', 'bestseller'], rating: 4.5, reviewCount: 64, stock: 12, featured: true,
    createdAt: '2025-03-04',
  },
  {
    id: 'p38', name: 'Soy Candle, Fig & Fig Leaf', kw: 'scented candle', vendorId: 'v-fern', category: 'Plants & Fragrance',
    price: 34,
    description: 'A 45-hour candle that smells green and a little milky, like a fig picked early.',
    materials: 'Soy-coconut wax, cotton wick, fragrance oil',
    tags: ['candle', 'fragrance'], rating: 4.6, reviewCount: 118, stock: 60,
    createdAt: '2025-02-28',
  },
  {
    id: 'p39', name: 'Hanging Planter', kw: 'hanging planter', vendorId: 'v-fern', category: 'Decor',
    price: 46,
    description: 'A stoneware planter with a leather cord, sized for a trailing pothos.',
    materials: 'Stoneware, vegetable-tanned leather cord',
    tags: ['planter', 'new'], rating: 4.4, reviewCount: 39, stock: 28,
    createdAt: '2025-03-08',
  },
  {
    id: 'p40', name: 'Watering Can, 1.5L', kw: 'watering can', vendorId: 'v-fern', category: 'Decor',
    price: 52,
    description: 'A powder-coated steel can with a long spout that reaches the back of a shelf.',
    materials: 'Powder-coated steel, brass rose',
    tags: ['tools', 'garden'], rating: 4.7, reviewCount: 51, stock: 40,
    createdAt: '2025-01-16',
  },
  {
    id: 'p41', name: 'Dried Bunch, Seasonal', kw: 'dried flowers', vendorId: 'v-fern', category: 'Plants & Fragrance',
    price: 40,
    description: 'A loose, low-drama bunch of dried grasses and seed heads that lasts a year.',
    materials: 'Dried botanicals, paper wrap',
    tags: ['dried', 'decor'], rating: 4.3, reviewCount: 28, stock: 22,
    createdAt: '2025-02-20',
  },
  {
    id: 'p42', name: 'Brass Plant Mister', kw: 'brass bottle', vendorId: 'v-fern', category: 'Plants & Fragrance',
    price: 36, originalPrice: 44,
    description: 'A pump-action brass mister that looks good enough to leave out.',
    materials: 'Solid brass, glass reservoir',
    tags: ['tools', 'brass', 'sale'], rating: 4.6, reviewCount: 66, stock: 35,
    createdAt: '2024-12-28',
  },
]

export const seedProducts: Product[] = seeds.map(build)
