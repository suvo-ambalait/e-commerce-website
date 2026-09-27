import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'
import { useClickOutside } from '@/shared/hooks/useClickOutside'

export function Menu({
  trigger,
  children,
  align = 'right',
  side = 'bottom',
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  /** open below (default) or above the trigger */
  side?: 'bottom' | 'top'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: easeEditorial }}
            className={cn(
              'absolute z-50 min-w-52 rounded-xl border border-border bg-surface p-1.5 shadow-lg',
              side === 'top' ? 'bottom-full mb-2' : 'mt-2',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const itemClass =
  'block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink'

export function MenuLink({ to, onClick, children }: { to: string; onClick?: () => void; children: ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className={itemClass}>
      {children}
    </Link>
  )
}

export function MenuButton({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={itemClass}>
      {children}
    </button>
  )
}
