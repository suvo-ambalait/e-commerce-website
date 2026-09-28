import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LuCamera, LuImage, LuPencil, LuStar } from 'react-icons/lu'
import { Avatar, Button, Container, Field, ImageUploader, Input, Modal, Rating, Section, Textarea } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatDateLong } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/Toast'
import { useCustomer } from '@/features/account/lib/useCustomer'
import { useCatalog } from '../context/CatalogContext'
import { CustomerPhotoGallery, ReviewPhotoStrip } from './ReviewPhotos'

const MAX_PHOTOS = 4
const ratingWords = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Loved it']

export function ReviewsSection({ productId }: { productId: string }) {
  const { reviewsFor, addReview } = useCatalog()
  const { notify } = useToast()
  const { profile } = useCustomer()
  const reviews = reviewsFor(productId)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [photosOnly, setPhotosOnly] = useState(false)

  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const withPhotos = reviews.filter((r) => r.images?.length)
  const shown = photosOnly ? withPhotos : reviews

  const gallery = useMemo(
    () =>
      reviews.flatMap((r) =>
        (r.images ?? []).map((src) => ({
          src,
          caption: (
            <>
              <span className="font-semibold text-white">{r.author}</span> · {'★'.repeat(r.rating)} · {r.title}
            </>
          ),
        })),
      ),
    [reviews],
  )

  const reset = () => {
    setOpen(false)
    setTitle('')
    setComment('')
    setImages([])
    setRating(5)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    addReview({
      productId,
      // TODO: use the signed-in customer's name once auth is connected
      author: profile.name || 'Anonymous',
      rating,
      title: title.trim() || ratingWords[rating],
      comment: comment.trim(),
      images: images.length ? images : undefined,
    })
    reset()
    notify(images.length ? 'Thanks — your review and photos are up' : 'Thanks for the review', 'success')
  }

  const shownStars = hover || rating

  return (
    <Section className="border-t border-border">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr]">
          {/* summary + form */}
          <div>
            <h2 className="text-2xl text-ink">Reviews</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-serif text-3xl text-ink">{average.toFixed(1)}</span>
              <div>
                <Rating value={average} size="md" />
                <p className="mt-1 text-caption text-ink-mute">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  {withPhotos.length > 0 && ` · ${withPhotos.length} with photos`}
                </p>
              </div>
            </div>
            <Button variant="secondary" className="mt-5" onClick={() => setOpen(true)}>
              <LuPencil className="h-4 w-4" />
              Write a review
            </Button>
            <Link to="/reviews" className="mt-3 block text-caption font-semibold text-accent hover:underline">
              Read reviews for every product →
            </Link>

            <Modal open={open} onClose={reset} title="Write a review" size="lg">
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-ink">Your rating</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={rating === n}
                          aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHover(n)}
                          className={cn('p-0.5 transition-transform hover:scale-110', n <= shownStars ? 'text-accent' : 'text-border-strong')}
                        >
                          <LuStar className="h-7 w-7 fill-current" />
                        </button>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-ink">{ratingWords[shownStars]}</span>
                  </div>
                </div>

                <Field label="Headline">
                  {(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a few words" />}
                </Field>
                <Field label="Your review" required>
                  {(id) => (
                    <Textarea id={id} required rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How’s the quality? Does it look like the photos?" />
                  )}
                </Field>

                <div>
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
                    <LuCamera className="h-4 w-4 text-accent" />
                    Add photos <span className="font-normal text-ink-mute">(optional)</span>
                  </p>
                  <p className="mb-2.5 text-caption text-ink-mute">
                    Up to {MAX_PHOTOS} photos. Real photos help other shoppers most.
                  </p>
                  <ImageUploader max={MAX_PHOTOS} value={images} onChange={setImages} maxEdge={800} quality={0.7} />
                </div>

                <p className="flex items-center gap-2 rounded-xl bg-surface-sunken/70 px-3 py-2 text-caption text-ink-mute">
                  <Avatar name={profile.name} size={20} />
                  Posting as <span className="font-semibold text-ink">{profile.name}</span>
                </p>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button type="button" variant="ghost" onClick={reset}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit review</Button>
                </div>
              </form>
            </Modal>
          </div>

          {/* photos + list */}
          <div className="space-y-6">
            {gallery.length > 0 && <CustomerPhotoGallery photos={gallery} />}

            {withPhotos.length > 0 && (
              <div className="flex gap-2">
                {[
                  { value: false, label: `All reviews (${reviews.length})` },
                  { value: true, label: `With photos (${withPhotos.length})` },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    aria-pressed={photosOnly === t.value}
                    onClick={() => setPhotosOnly(t.value)}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-caption font-semibold transition-colors',
                      photosOnly === t.value ? 'bg-ink text-bg' : 'bg-surface-sunken text-ink-soft hover:text-ink',
                    )}
                  >
                    {t.value && <LuImage className="h-3.5 w-3.5" />}
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {shown.length === 0 ? (
              <p className="text-sm text-ink-mute">No reviews yet — be the first.</p>
            ) : (
              shown.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center justify-between">
                    <Rating value={review.rating} />
                    <span className="text-caption text-ink-mute">{formatDateLong(review.date)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">{review.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3">
                      <ReviewPhotoStrip
                        images={review.images}
                        caption={
                          <>
                            <span className="font-semibold text-white">{review.author}</span> · {review.title}
                          </>
                        }
                      />
                    </div>
                  )}
                  <p className="mt-3 flex items-center gap-2 text-caption text-ink-mute">
                    <Avatar name={review.author} size={20} />
                    {review.author}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
