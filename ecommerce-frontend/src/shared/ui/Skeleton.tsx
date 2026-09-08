import { LuLoaderCircle } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-surface-sunken', className)} />
}

export function Spinner({ className }: { className?: string }) {
  return <LuLoaderCircle className={cn('h-5 w-5 animate-spin text-ink-mute', className)} />
}
