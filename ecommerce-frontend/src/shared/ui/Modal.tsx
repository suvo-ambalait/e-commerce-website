import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { easeEditorial } from '@/shared/lib/motion'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { CloseIcon } from './icons'
import { IconButton } from './IconButton'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}) {
  useScrollLock(open)

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.24, ease: easeEditorial }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              {title && <h2 className="text-xl text-ink">{title}</h2>}
              <IconButton label="Close" size="sm" className="-mr-2" onClick={onClose}>
                <CloseIcon className="h-5 w-5" />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
