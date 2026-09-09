import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LuLockKeyhole } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, Container, Field, Input, Section } from '@/shared/ui'
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
  useDocumentTitle('New password · MorerDokan')
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
    <Section>
      <Container size="narrow" className="max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AuthIntro
            backTo="/login"
            backLabel="Back to sign in"
            icon={<LuLockKeyhole className="h-5 w-5" />}
            title="Set a new password"
          >
            For <span className="font-medium text-ink">{state.email}</span>. Choose something you haven&rsquo;t used before.
          </AuthIntro>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="New password" required>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  minLength={MIN_LENGTH}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                />
              )}
            </Field>

            {password && (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={
                        'h-1 flex-1 rounded-full transition-colors ' +
                        (i < score
                          ? score <= 1
                            ? 'bg-danger'
                            : score === 2
                              ? 'bg-warning'
                              : 'bg-success'
                          : 'bg-border-strong')
                      }
                    />
                  ))}
                </div>
                <p className="text-caption text-ink-mute">{strengthLabel[score]}</p>
              </div>
            )}

            <Field label="Confirm password" required>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    if (error) setError(null)
                  }}
                />
              )}
            </Field>

            {error && <p className="text-caption text-danger">{error}</p>}

            <Button type="submit" size="lg" fullWidth>
              Update password
            </Button>
          </form>
        </motion.div>
      </Container>
    </Section>
  )
}
