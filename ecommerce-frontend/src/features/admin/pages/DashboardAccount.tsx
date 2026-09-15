import { PageHeader } from '../components/primitives'
import { ButtonLink } from '@/shared/ui'
import { useTheme } from '@/shared/hooks/useTheme'

export function DashboardAccount() {
  const { choice, setChoice } = useTheme()

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Your profile" description="Applies across the dashboard and storefront." />

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm font-medium text-ink">Appearance</p>
        <div className="mt-3 flex gap-2">
          {(['light', 'dark', 'system'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setChoice(opt)}
              className={`rounded-full border px-4 py-1.5 text-caption capitalize transition-colors ${
                choice === opt ? 'border-transparent bg-ink text-bg' : 'border-border-strong text-ink-soft hover:border-ink'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <ButtonLink to="/" variant="secondary">
          Switch to storefront
        </ButtonLink>
      </div>
    </div>
  )
}
