import { cn } from '@/shared/lib/cn'
import { useSettings } from '@/features/admin/context/SettingsContext'

/** Brand artwork in `public/AmbalaEshop-logo`. */
const LOGO = {
  /** full-colour wordmark for light backgrounds */
  light: '/AmbalaEshop-logo/logo-color.svg',
  /** full-colour wordmark for dark backgrounds (transparent copy of logo-color-on-black) */
  dark: '/AmbalaEshop-logo/logo-color-on-dark.svg',
  /** bag mark only */
  icon: '/AmbalaEshop-logo/icon-color.svg',
  /** bag mark on a violet rounded square */
  appIcon: '/AmbalaEshop-logo/app-icon.svg',
}

/**
 * The bag mark on its own. Sized in `em`, so a text-size class on `className`
 * scales it. `boxed` uses the violet app-icon square (collapsed sidebars).
 */
export function Logo({ className, boxed = false }: { className?: string; boxed?: boolean }) {
  const { settings } = useSettings()
  return (
    <img
      src={boxed ? LOGO.appIcon : LOGO.icon}
      alt={settings.storeName}
      className={cn('inline-block h-[1.6em] w-[1.6em] shrink-0 select-none', className)}
      draggable={false}
    />
  )
}

/**
 * Full logo: bag mark + AmbalaEshop wordmark. Sized in `em` via `className`.
 * - default: colour logo in light mode, light-text logo in dark mode
 * - `onDark`: always the light-text logo (for fixed-dark areas like the footer)
 * - `compact`: shows only the bag mark on very narrow screens
 */
export function BrandLockup({ className, onDark = false, compact = false }: { className?: string; onDark?: boolean; compact?: boolean }) {
  const { settings } = useSettings()
  const img = 'block h-[1.9em] w-auto max-w-none select-none'

  return (
    <span className={cn('inline-flex items-center', className)}>
      {onDark ? (
        <img src={LOGO.dark} alt={settings.storeName} className={cn(img, compact && 'max-[379px]:hidden')} draggable={false} />
      ) : (
        <>
          <img src={LOGO.light} alt={settings.storeName} className={cn(img, 'dark:hidden', compact && 'max-[379px]:hidden')} draggable={false} />
          <img src={LOGO.dark} alt={settings.storeName} className={cn(img, 'hidden dark:block', compact && 'max-[379px]:hidden!')} draggable={false} />
        </>
      )}
      {compact && <Logo className="h-[1.9em] w-[1.9em] min-[380px]:hidden" />}
    </span>
  )
}
