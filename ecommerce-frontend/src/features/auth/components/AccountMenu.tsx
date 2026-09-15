import { Link } from 'react-router-dom'
import { UserIcon } from '@/shared/ui/icons'

export function AccountMenu() {
  return (
    <Link
      to="/login"
      aria-label="Sign in"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink"
    >
      <UserIcon className="h-5 w-5" />
    </Link>
  )
}
