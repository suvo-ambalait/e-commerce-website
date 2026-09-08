import { cn } from '@/shared/lib/cn'
import { useSettings } from '@/features/admin/context/SettingsContext'

/**
 * Brand lockup — a line-art storefront mark (matches `public/favicon.svg`) plus
 * the wordmark. The mark is drawn in `currentColor`, so it takes the ink colour
 * of wherever it sits and needs no light/dark branching. The wordmark text comes
 * from store settings so it stays admin-configurable.
 */
export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  const { settings } = useSettings()

  return (
    <span className={cn('inline-flex items-center gap-2 text-ink', className)}>
      <svg
        viewBox="0 0 32 32"
        aria-hidden
        className="h-[1.1em] w-auto shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 13 9.2 7.5H22.8L26 13Z" />
        <path d="M8.4 13V25H23.6V13" />
        <path d="M13.4 25V18.2H18.6V25" />
      </svg>
      {!markOnly && (
        <span className="font-serif text-[1.15em] leading-none tracking-tight">
          {settings.storeName}
        </span>
      )}
    </span>
  )
}
