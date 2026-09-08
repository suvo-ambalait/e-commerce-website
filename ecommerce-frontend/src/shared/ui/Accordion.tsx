import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LuPlus } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'

export interface AccordionItem {
  id: string
  question: ReactNode
  answer: ReactNode
}

export function Accordion({
  items,
  className,
  defaultOpen,
}: {
  items: AccordionItem[]
  className?: string
  defaultOpen?: string
}) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null)

  return (
    <div className={cn('divide-y divide-border border-y border-border', className)}>
      {items.map((item) => {
        const isOpen = open === item.id
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-ink"
            >
              {item.question}
              <LuPlus
                className={cn('h-4 w-4 shrink-0 text-ink-mute transition-transform duration-[var(--dur-2)]', isOpen && 'rotate-45')}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: easeEditorial }}
                  className="overflow-hidden"
                >
                  <div className="pb-5 pr-8 text-sm leading-relaxed text-ink-soft">{item.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
