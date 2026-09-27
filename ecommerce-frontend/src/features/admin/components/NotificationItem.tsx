import { useNavigate } from 'react-router-dom'
import { LuPackage, LuStar, LuStore, LuTriangleAlert } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/shared/ui/Toast'
import { kindLabels, relativeTime, type Note, type NoteKind } from '../lib/useNotificationFeed'

const kindIcon: Record<NoteKind, typeof LuPackage> = {
  order: LuPackage,
  stock: LuTriangleAlert,
  vendor: LuStore,
  review: LuStar,
}

const kindPill: Record<NoteKind, string> = {
  order: 'bg-accent-soft text-accent',
  stock: 'bg-warning-soft text-warning',
  vendor: 'bg-accent-soft text-accent',
  review: 'bg-surface-sunken text-ink-soft',
}

/** One notification — shared by the bell menu (compact) and the notifications page. */
export function NotificationItem({
  note,
  unread,
  onRead,
  onNavigate,
  variant = 'menu',
}: {
  note: Note
  unread: boolean
  onRead: () => void
  /** called after navigating away (menu uses it to close) */
  onNavigate?: () => void
  variant?: 'menu' | 'page'
}) {
  const navigate = useNavigate()
  const { notify } = useToast()
  const Icon = kindIcon[note.kind]

  const open = (to: string) => {
    onRead()
    onNavigate?.()
    navigate(to)
  }

  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded-2xl border p-3 transition-colors',
        unread ? 'border-border bg-surface shadow-sm' : 'border-transparent',
        'hover:border-accent/30! hover:bg-accent-soft/30',
      )}
    >
      {/* whole-row link (actions sit above it) */}
      <button
        type="button"
        onClick={() => open(note.to)}
        aria-label={note.title}
        className="absolute inset-0 rounded-2xl"
      />

      <span className="relative h-11 w-11 shrink-0">
        <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-accent-soft text-accent">
          {note.image ? (
            <img src={note.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </span>
        <span
          className={cn(
            'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md ring-2 ring-surface',
            note.severity ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent',
          )}
        >
          <Icon className="h-3 w-3" />
        </span>
      </span>

      <div className="relative min-w-0 flex-1 pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate font-display text-sm font-bold text-ink">{note.title}</span>
            {variant === 'page' && (
              <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold', kindPill[note.kind])}>
                {kindLabels[note.kind]}
              </span>
            )}
          </p>
          <span className="flex shrink-0 items-center gap-2 text-caption text-ink-mute">
            {relativeTime(note.date)}
            {unread &&
              (variant === 'page' ? (
                <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Unread
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-accent" aria-label="Unread" />
              ))}
          </span>
        </div>
        <p className="mt-0.5 truncate text-caption text-ink-mute">{note.body}</p>

        {note.actions.length > 0 && (
          <div className="pointer-events-auto mt-2.5 flex flex-wrap gap-2">
            {note.actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  if (a.run) {
                    a.run()
                    onRead()
                    notify(`${a.label} — done`, 'success')
                  } else if (a.to) open(a.to)
                }}
                className={cn(
                  'h-8 rounded-lg px-3 text-caption font-semibold transition-colors',
                  a.primary
                    ? 'bg-ink text-bg hover:opacity-90'
                    : 'border border-border-strong bg-surface text-ink hover:border-accent! hover:text-accent',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
