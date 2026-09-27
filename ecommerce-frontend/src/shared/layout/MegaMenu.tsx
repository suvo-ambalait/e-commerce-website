import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import type { Category } from '@/shared/types'
import { ChevronDownIcon } from '@/shared/ui/icons'

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
          'flex h-8 items-center gap-1 rounded-full px-3.5 text-sm font-medium transition-colors',
          active || open ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
        )}
      >
        Categories
        <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
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
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-3 shadow-lg">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop?category=${encodeURIComponent(category.name)}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-sunken"
                >
                  <img src={category.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
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
                className="col-span-2 mt-1 rounded-full bg-accent px-3 py-2.5 text-center text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
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
