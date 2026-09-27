import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuKeyRound } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { MailIcon } from '@/shared/ui/icons'
import { AuthField, AuthShell, AuthSubmit } from '../components/AuthLayout'
import { AuthIntro } from '../components/AuthIntro'
import { issueChallenge } from '../lib/recovery'

export function ForgotPasswordPage() {
  useDocumentTitle('Reset password · AmbalaEshop')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    issueChallenge(trimmed)
    navigate('/verify-otp', { state: { email: trimmed.toLowerCase() } })
  }

  return (
    <AuthShell>
      <AuthIntro
        backTo="/login"
        backLabel="Back to sign in"
        icon={<LuKeyRound className="h-5 w-5" />}
        title={
          <>
            Forgot your <em>password?</em>
          </>
        }
      >
        Enter the email on your account and we&rsquo;ll send a 6-digit code to reset it.
      </AuthIntro>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <AuthField
          label="Email"
          icon={<MailIcon className="h-4 w-4" />}
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthSubmit>Send reset code</AuthSubmit>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mute">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
