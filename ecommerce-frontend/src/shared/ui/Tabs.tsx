import { useId, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode, type SVGProps } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { easeEditorial } from '@/shared/lib/motion'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}

/**
 * Pill-style tabs: a sunken track with a sliding white "thumb" under the active
 * tab, and the panel in a card below. Arrow keys, Home and End move between tabs.
 */
export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.id)
  const current = items.find((i) => i.id === active) ?? items[0]
  const baseId = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (index: number) => {
    const i = (index + items.length) % items.length
    setActive(items[i].id)
    refs.current[i]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 }
    if (e.key in keys) {
      e.preventDefault()
      focusTab(keys[e.key])
    }
  }

  return (
    <div className={className}>
      <div role="tablist" className="flex w-full gap-1 overflow-x-auto rounded-2xl bg-surface-sunken p-1">
        {items.map((item, i) => {
          const selected = item.id === current?.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              id={`${baseId}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'relative flex min-w-fit flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                selected ? 'text-ink' : 'text-ink-mute hover:text-ink',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${baseId}-thumb`}
                  className="absolute inset-0 rounded-xl bg-surface shadow-sm ring-1 ring-border"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              {Icon && <Icon className={cn('relative h-4 w-4 shrink-0', selected ? 'text-accent' : '')} />}
              <span className="relative">{item.label}</span>
            </button>
          )
        })}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={current ? `${baseId}-tab-${current.id}` : undefined}
        className="mt-3 rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-ink-soft shadow-sm"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current?.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: easeEditorial }}
          >
            {current?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
