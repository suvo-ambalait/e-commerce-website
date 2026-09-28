import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LuChevronLeft, LuChevronRight, LuExpand, LuZoomIn } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { PhotoLightbox } from './ReviewPhotos'

/**
 * Product image viewer: large image with arrows, counter and hover zoom,
 * a thumbnail rail (vertical on desktop, scrolling row on phones), and a
 * full-screen viewer on click.
 */
export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState(1)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const [fullscreen, setFullscreen] = useState<number | null>(null)
  const list = images.length ? images : ['']
  const many = list.length > 1
  const current = list[active] ?? list[0]

  const go = (index: number) => {
    const next = (index + list.length) % list.length
    setDirection(next > active || (active === list.length - 1 && next === 0) ? 1 : -1)
    setActive(next)
    setZoom(null)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(active + 1)
    if (e.key === 'ArrowLeft') go(active - 1)
    if (e.key === 'Enter') setFullscreen(active)
  }

  // zoom follows the pointer, only on devices that can hover (not touch)
  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!canHover) return
    const rect = e.currentTarget.getBoundingClientRect()
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row lg:sticky lg:top-28 lg:self-start">
      {/* thumbnails */}
      {many && (
        <div
          className="-m-1.5 flex shrink-0 gap-2.5 overflow-x-auto p-1.5 [scrollbar-width:none] sm:max-h-144 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Product images"
        >
          {list.map((src, i) => {
            const selected = i === active
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`Image ${i + 1} of ${list.length}`}
                onClick={() => go(i)}
                className={cn(
                  'relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-surface-sunken transition-[box-shadow,opacity] sm:w-20',
                  selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : 'opacity-70 ring-1 ring-border hover:opacity-100',
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            )
          })}
        </div>
      )}

      {/* main image */}
      <div
        className="group relative aspect-4/5 flex-1 overflow-hidden rounded-3xl bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        tabIndex={0}
        role="button"
        aria-label={`${alt} — open full screen`}
        onKeyDown={onKeyDown}
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setFullscreen(active)}
        style={{ cursor: canHover ? 'zoom-in' : 'pointer' }}
      >
        {/* zoom lives on this wrapper so it never fights the slide animation */}
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={
            zoom
              ? {
                  transform: 'scale(1.9)',
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                }
              : undefined
          }
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.img
              key={`${current}-${active}`}
              src={current}
              alt={alt}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              draggable={false}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />
          </AnimatePresence>
        </div>

        {/* counter */}
        {many && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm backdrop-blur tabular-nums">
            {active + 1} / {list.length}
          </span>
        )}

        {/* full-screen button */}
        <button
          type="button"
          aria-label="Open full screen"
          onClick={(e) => {
            e.stopPropagation()
            setFullscreen(active)
          }}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm backdrop-blur transition-colors hover:bg-surface hover:text-accent"
        >
          <LuExpand className="h-4 w-4" />
        </button>

        {/* arrows: always on touch screens, on hover elsewhere */}
        {many && (
          <>
            <Arrow side="left" onClick={() => go(active - 1)} />
            <Arrow side="right" onClick={() => go(active + 1)} />
          </>
        )}

        {/* hint */}
        {canHover && !zoom && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-semibold text-ink-soft opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
            <LuZoomIn className="h-3.5 w-3.5" />
            Hover to zoom · click to expand
          </span>
        )}

        {/* dots on phones */}
        {many && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
            {list.map((_, i) => (
              <span key={i} className={cn('h-1.5 rounded-full transition-all', i === active ? 'w-5 bg-surface' : 'w-1.5 bg-surface/60')} />
            ))}
          </div>
        )}
      </div>

      <PhotoLightbox photos={list.map((src) => ({ src, caption: alt }))} index={fullscreen} onClose={() => setFullscreen(null)} />
    </div>
  )
}

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? LuChevronLeft : LuChevronRight
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-md backdrop-blur transition-[opacity,background-color,color] hover:bg-surface hover:text-accent',
        'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
