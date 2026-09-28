import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { useScrollLock } from '@/shared/hooks/useScrollLock'

export interface LightboxPhoto {
  src: string
  /** shown under the photo, e.g. the reviewer and stars */
  caption?: ReactNode
}

/** Full-screen photo viewer with arrow-key and swipe-free button navigation. */
export function PhotoLightbox({ photos, index, onClose }: { photos: LightboxPhoto[]; index: number | null; onClose: () => void }) {
  const [current, setCurrent] = useState(index ?? 0)
  const open = index !== null
  useScrollLock(open)

  useEffect(() => {
    if (index !== null) setCurrent(index)
  }, [index])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % photos.length)
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, photos.length, onClose])

  if (!open || photos.length === 0) return null
  const photo = photos[Math.min(current, photos.length - 1)]
  const many = photos.length > 1

  return createPortal(
    <div className="fixed inset-0 z-[130] flex flex-col bg-[#0b0a10]/95 text-white" role="dialog" aria-modal="true" aria-label="Review photos">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-caption text-white/70 tabular-nums">
          {current + 1} / {photos.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <LuX className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4" onClick={onClose}>
        <img src={photo.src} alt="" className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        {many && (
          <>
            <NavButton side="left" onClick={() => setCurrent((c) => (c - 1 + photos.length) % photos.length)} />
            <NavButton side="right" onClick={() => setCurrent((c) => (c + 1) % photos.length)} />
          </>
        )}
      </div>

      <div className="px-4 pb-4 pt-3">
        {photo.caption && <div className="mx-auto max-w-2xl text-center text-sm text-white/85">{photo.caption}</div>}
        {many && (
          <div className="mx-auto mt-3 flex max-w-2xl justify-center gap-2 overflow-x-auto">
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Photo ${i + 1}`}
                className={cn('h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-2 transition-opacity', i === current ? 'ring-white' : 'opacity-50 ring-transparent hover:opacity-80')}
              >
                <img src={p.src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? LuChevronLeft : LuChevronRight
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={cn(
        'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-white/20',
        side === 'left' ? 'left-3 sm:left-6' : 'right-3 sm:right-6',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

/** A review's photos as small thumbnails; clicking one opens the viewer. */
export function ReviewPhotoStrip({ images, caption, size = 'md' }: { images: string[]; caption?: ReactNode; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!images.length) return null
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`View photo ${i + 1} of ${images.length}`}
            className={cn(
              'overflow-hidden rounded-xl border border-border transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              size === 'sm' ? 'h-14 w-14' : 'h-20 w-20',
            )}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <PhotoLightbox photos={images.map((src) => ({ src, caption }))} index={open} onClose={() => setOpen(null)} />
    </>
  )
}

/** Horizontal gallery of photos from many reviews, e.g. “Customer photos”. */
export function CustomerPhotoGallery({ photos, title = 'Customer photos', limit = 8 }: { photos: LightboxPhoto[]; title?: string; limit?: number }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!photos.length) return null
  const extra = photos.length - limit

  return (
    <div>
      <p className="mb-2.5 text-sm font-semibold text-ink">
        {title} <span className="font-normal text-ink-mute">({photos.length})</span>
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.slice(0, limit).map((p, i) => {
          const isLast = i === limit - 1 && extra > 0
          return (
            <button
              key={i}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={isLast ? `View all ${photos.length} photos` : `View photo ${i + 1}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border"
            >
              <img src={p.src} alt="" className="h-full w-full object-cover transition-transform hover:scale-105" />
              {isLast && (
                <span className="absolute inset-0 flex items-center justify-center bg-[#0b0a10]/60 text-sm font-bold text-white">+{extra + 1}</span>
              )}
            </button>
          )
        })}
      </div>
      <PhotoLightbox photos={photos} index={open} onClose={() => setOpen(null)} />
    </div>
  )
}
