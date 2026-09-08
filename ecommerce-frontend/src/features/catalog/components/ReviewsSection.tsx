import { useState, type FormEvent } from 'react'
import { LuStar } from 'react-icons/lu'
import { Button, Container, Field, Input, Rating, Section, Textarea } from '@/shared/ui'
import { formatDateLong } from '@/shared/lib/format'
import { useCatalog } from '../context/CatalogContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/ui/Toast'

export function ReviewsSection({ productId }: { productId: string }) {
  const { reviewsFor, addReview } = useCatalog()
  const { user } = useAuth()
  const { notify } = useToast()
  const reviews = reviewsFor(productId)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  const average = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    addReview({
      productId,
      author: user?.name ?? 'Anonymous',
      rating,
      title: title.trim() || 'Review',
      comment: comment.trim(),
    })
    setOpen(false)
    setTitle('')
    setComment('')
    notify('Thanks for the review', 'success')
  }

  return (
    <Section className="border-t border-border">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-2xl text-ink">Reviews</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-serif text-3xl text-ink">{average.toFixed(1)}</span>
              <div>
                <Rating value={average} size="md" />
                <p className="mt-1 text-caption text-ink-mute">{reviews.length} verified</p>
              </div>
            </div>
            <Button variant="secondary" className="mt-5" onClick={() => setOpen((o) => !o)}>
              {open ? 'Cancel' : 'Write a review'}
            </Button>

            {open && (
              <form onSubmit={submit} className="mt-5 space-y-3 rounded-lg border border-border bg-surface p-4">
                <div>
                  <p className="mb-1.5 text-caption font-medium tracking-wide text-ink-soft">Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} stars`}
                        className={n <= rating ? 'text-accent' : 'text-border-strong'}
                      >
                        <LuStar className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Headline">
                  {(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sums it up" />}
                </Field>
                <Field label="Your review" required>
                  {(id) => (
                    <Textarea
                      id={id}
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What stood out?"
                    />
                  )}
                </Field>
                <Button type="submit" size="sm">
                  Submit review
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-sm text-ink-mute">No reviews yet — be the first.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center justify-between">
                    <Rating value={review.rating} />
                    <span className="text-caption text-ink-mute">{formatDateLong(review.date)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">{review.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
                  <p className="mt-2 text-caption text-ink-mute">{review.author}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
