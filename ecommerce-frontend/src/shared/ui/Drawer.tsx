import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { CloseIcon } from './icons'
import { IconButton } from './IconButton'

export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  children,
  widthClass = 'w-full max-w-md',
}: {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right'
  title?: ReactNode
  children: ReactNode
  widthClass?: string
}) {
  useScrollLock(open)

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ duration: 0.32, ease: easeEditorial }}
            className={cn(
              'absolute inset-y-0 flex flex-col bg-surface shadow-lg',
              side === 'right' ? 'right-0' : 'left-0',
              widthClass,
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="text-caption font-medium uppercase tracking-[0.14em] text-ink-soft">{title}</p>
              <IconButton label="Close" size="sm" onClick={onClose}>
                <CloseIcon className="h-5 w-5" />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
