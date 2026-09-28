import type { ReactNode } from 'react'
import { LuLock } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import type { Role, RoleColor } from './store'

export const roleChipTone: Record<RoleColor, string> = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-sunken text-ink-soft',
}

export const roleDotTone: Record<RoleColor, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-ink-mute',
}

/** Small coloured pill with the role's label. Unknown role names render grey. */
export function RoleChip({ role, name, className }: { role?: Role; name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold',
        roleChipTone[role?.color ?? 'neutral'],
        className,
      )}
    >
      {role?.system && <LuLock className="h-2.5 w-2.5 opacity-70" aria-hidden />}
      {role?.label ?? name}
    </span>
  )
}

export function RoleDot({ color, className }: { color: RoleColor; className?: string }) {
  return <span className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', roleDotTone[color], className)} />
}

/** "12 / 40" with a thin bar. */
export function CoverageBar({ value, total, className }: { value: number; total: number; className?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between text-caption">
        <span className="text-ink-mute">Permissions</span>
        <span className="font-semibold text-ink tabular-nums">
          {value}
          <span className="font-normal text-ink-mute"> / {total}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.max(pct ? 3 : 0, pct)}%` }} />
      </div>
    </div>
  )
}

/** Label + hint above a group of controls inside modals/drawers. */
export function SectionLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">{children}</p>
      {hint && <p className="text-caption text-ink-mute">{hint}</p>}
    </div>
  )
}
