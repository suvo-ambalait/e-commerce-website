import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import type { Category } from '@/shared/types'

export function MegaMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const active = pathname.startsWith('/categories')
  useClickOutside(ref, () => setOpen(false), open)

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        className={cn(
          'relative py-1 text-sm transition-colors hover:text-ink',
          'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-accent after:transition-transform after:duration-200 hover:after:scale-x-100',
          active || open ? 'text-ink after:scale-x-100' : 'text-ink-soft after:scale-x-0',
        )}
      >
        Categories
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: easeEditorial }}
            className="absolute left-0 top-full z-50 w-lg max-w-[calc(100vw-2rem)] pt-3"
          >
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-3 shadow-lg">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop?category=${encodeURIComponent(category.name)}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-sm p-2 transition-colors hover:bg-surface-sunken"
                >
                  <img src={category.image} alt="" className="h-12 w-12 shrink-0 rounded-sm object-cover" />
                  <span>
                    <span className="block text-sm text-ink">{category.name}</span>
                    <span className="line-clamp-1 block text-caption text-ink-mute">
                      {category.description}
                    </span>
                  </span>
                </Link>
              ))}
              <Link
                to="/shop"
                onClick={() => setOpen(false)}
                className="col-span-2 mt-1 rounded-sm bg-ink px-3 py-2.5 text-center text-caption font-medium uppercase tracking-wide text-bg"
              >
                Shop everything
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
