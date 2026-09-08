import { useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.id)
  const current = items.find((i) => i.id === active) ?? items[0]

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-6 border-b border-border">
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={item.id === active}
            onClick={() => setActive(item.id)}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm transition-colors',
              item.id === active
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-mute hover:text-ink-soft',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-6 text-sm leading-relaxed text-ink-soft">
        {current?.content}
      </div>
    </div>
  )
}
