import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LuLock, LuLockKeyhole } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { AuthField, AuthShell, AuthSubmit } from '../components/AuthLayout'
import { useToast } from '@/shared/ui/Toast'
import { AuthIntro } from '../components/AuthIntro'
import { clearChallenge } from '../lib/recovery'

const MIN_LENGTH = 8

function strengthOf(pw: string) {
  let score = 0
  if (pw.length >= MIN_LENGTH) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score // 0..4
}

const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

export function ResetPasswordPage() {
  useDocumentTitle('New password · AmbalaEshop')
  const navigate = useNavigate()
  const location = useLocation()
  const { notify } = useToast()

  const state = location.state as { email?: string; verified?: boolean } | null
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const score = useMemo(() => strengthOf(password), [password])

  // Only reachable straight after a verified code.
  if (!state?.email || !state.verified) return <Navigate to="/forgot-password" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords don’t match.')
      return
    }
    // Demo app — there is no password store; the sign-in page accepts anything.
    clearChallenge()
    notify('Password updated — you can sign in now', 'success')
    navigate('/login', { replace: true })
  }

  return (
    <AuthShell>
      <AuthIntro
        backTo="/login"
        backLabel="Back to sign in"
        icon={<LuLockKeyhole className="h-5 w-5" />}
        title={
          <>
            Set a new <em>password</em>
          </>
        }
      >
        For <span className="font-semibold text-ink">{state.email}</span>. Choose something you haven&rsquo;t used
        before.
      </AuthIntro>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <div>
          <AuthField
            label="New password"
            icon={<LuLock className="h-4 w-4" />}
            type="password"
            required
            autoFocus
            autoComplete="new-password"
            minLength={MIN_LENGTH}
            placeholder={`At least ${MIN_LENGTH} characters`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError(null)
            }}
          />
          {password && (
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={
                      'h-1.5 flex-1 rounded-full transition-colors ' +
                      (i < score
                        ? score <= 1
                          ? 'bg-danger'
                          : score === 2
                            ? 'bg-warning'
                            : 'bg-accent'
                        : 'bg-surface-sunken')
                    }
                  />
                ))}
              </div>
              <span className="w-16 text-right text-caption font-semibold text-ink-soft">{strengthLabel[score]}</span>
            </div>
          )}
        </div>

        <AuthField
          label="Confirm password"
          icon={<LuLock className="h-4 w-4" />}
          type="password"
          required
          autoComplete="new-password"
          placeholder="Type it again"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            if (error) setError(null)
          }}
        />

        {error && <p className="text-caption font-medium text-danger">{error}</p>}

        <AuthSubmit>Update password</AuthSubmit>
      </form>
    </AuthShell>
  )
}
