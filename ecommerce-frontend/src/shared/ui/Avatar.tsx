import { cn } from '@/shared/lib/cn'

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string
  name: string
  size?: number
  className?: string
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-caption font-medium text-bg',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  )
}
