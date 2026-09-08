import { useTheme } from '@/shared/hooks/useTheme'
import { IconButton } from '@/shared/ui'
import { MoonIcon, SunIcon } from '@/shared/ui/icons'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme()
  return (
    <IconButton
      label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      size="sm"
      onClick={toggle}
      className={className}
    >
      {resolved === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </IconButton>
  )
}
