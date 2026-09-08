import type { Review } from '@/shared/types'

/** A pool of reviews keyed loosely to products; the ReviewsSection filters by productId. */
export const seedReviews: Review[] = [
  { id: 'r1', productId: 'p1', author: 'Amara J.', rating: 5, date: '2025-07-14', title: 'Exactly the light I wanted', comment: 'The glow is genuinely soft — no hotspot, no glare. Brass is a real weight, not plated tin.' },
  { id: 'r2', productId: 'p1', author: 'Daniel K.', rating: 4, date: '2025-06-02', title: 'Beautiful, slight wait', comment: 'Took the full three weeks to arrive but the packaging was excellent and it was worth it.' },
  { id: 'r3', productId: 'p1', author: 'Priya S.', rating: 5, date: '2025-05-21', title: 'Looks like more than it cost', comment: 'People assume it is a designer piece. The dimmer goes properly low which I love.' },
  { id: 'r4', productId: 'p7', author: 'Marco V.', rating: 5, date: '2025-08-01', title: 'Our everyday mugs now', comment: 'The handle actually fits a whole finger. Glaze pooling is gorgeous and every pair is a little different.' },
  { id: 'r5', productId: 'p7', author: 'Lena H.', rating: 4, date: '2025-07-09', title: 'Lovely, a touch heavy', comment: 'Solid and warm in the hand. Slightly heavier than expected but I have got used to it.' },
  { id: 'r6', productId: 'p13', author: 'Tomás R.', rating: 5, date: '2025-06-18', title: 'Worth every cent', comment: 'Sat in a lot of "craft" chairs. This one is light, rigid, and the seat is genuinely comfortable for a dinner.' },
  { id: 'r7', productId: 'p19', author: 'Sofia B.', rating: 5, date: '2025-07-30', title: 'The indigo is deep', comment: 'Photos do not do the colour justice. Weighty enough for winter, and it has not shed at all.' },
  { id: 'r8', productId: 'p19', author: 'Noah W.', rating: 4, date: '2025-05-05', title: 'Great, needed an airing', comment: 'Faint natural-dye smell for the first week, gone now. Beautifully made.' },
  { id: 'r9', productId: 'p25', author: 'Ivy C.', rating: 5, date: '2025-08-12', title: 'The paper is the point', comment: 'Fountain pen does not feather or bleed. Lies completely flat. I have bought four.' },
  { id: 'r10', productId: 'p25', author: 'George M.', rating: 5, date: '2025-06-27', title: 'Perfect size', comment: 'A5 is the sweet spot and the letterpress cover has aged really nicely in my bag.' },
  { id: 'r11', productId: 'p31', author: 'Hana T.', rating: 5, date: '2025-07-19', title: 'Transportive', comment: 'Two capfuls and the whole bathroom smells like a cedar onsen. No oily ring on the tub either.' },
  { id: 'r12', productId: 'p31', author: 'Ruth A.', rating: 4, date: '2025-04-30', title: 'Lovely scent, small bottle', comment: 'Goes faster than I would like because I keep using more. That is on me.' },
  { id: 'r13', productId: 'p37', author: 'Cassie L.', rating: 4, date: '2025-08-20', title: 'Arrived healthy', comment: 'Bigger than expected and not a single damaged leaf. Took a week to settle then put out new growth.' },
  { id: 'r14', productId: 'p26', author: 'Felix N.', rating: 5, date: '2025-07-02', title: 'Patina is coming in nicely', comment: 'Heavy in a good way, writes smooth, and it is developing that mottled brass look after a month.' },
  { id: 'r15', productId: 'p9', author: 'Bea D.', rating: 5, date: '2025-06-11', title: 'On the table constantly', comment: 'Big enough for a family pasta, shallow enough for salad. The ash glaze is stunning.' },
]
