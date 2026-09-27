import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LuShieldCheck } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { AuthShell, AuthSubmit } from '../components/AuthLayout'
import { AuthIntro } from '../components/AuthIntro'
import { OtpInput } from '../components/OtpInput'
import { issueChallenge, readChallenge } from '../lib/recovery'

const RESEND_SECONDS = 30
const CODE_LENGTH = 6

export function VerifyOtpPage() {
  useDocumentTitle('Verify code · MorerDokan')
  const navigate = useNavigate()
  const location = useLocation()

  const stateEmail = (location.state as { email?: string } | null)?.email
  const email = stateEmail ?? readChallenge()?.email ?? null

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCountdown = () => {
    if (timer.current) clearInterval(timer.current)
    setSeconds(RESEND_SECONDS)
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1 && timer.current) clearInterval(timer.current)
        return Math.max(0, s - 1)
      })
    }, 1000)
  }

  useEffect(() => {
    startCountdown()
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  if (!email) return <Navigate to="/forgot-password" replace />

  const verify = (entered: string) => {
    const expected = readChallenge()?.code
    if (entered.length !== CODE_LENGTH) {
      setError('Enter all 6 digits.')
      return
    }
    if (expected && entered !== expected) {
      setError('That code doesn’t match. Check your email and try again.')
      return
    }
    setError(null)
    navigate('/reset-password', { state: { email, verified: true } })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    verify(code)
  }

  const resend = () => {
    issueChallenge(email)
    setCode('')
    setError(null)
    startCountdown()
  }

  const demoCode = readChallenge()?.code

  return (
    <AuthShell>
      <AuthIntro
        backTo="/forgot-password"
        backLabel="Use a different email"
        icon={<LuShieldCheck className="h-5 w-5" />}
        title={
          <>
            Check your <em>inbox</em>
          </>
        }
      >
        We sent a 6-digit code to <span className="font-semibold text-ink">{email}</span>. It expires in 10 minutes.
      </AuthIntro>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <div>
          <OtpInput
            value={code}
            onChange={(next) => {
              setCode(next)
              if (error) setError(null)
            }}
            length={CODE_LENGTH}
            invalid={Boolean(error)}
            onComplete={verify}
          />
          {error && <p className="mt-2 text-caption font-medium text-danger">{error}</p>}
        </div>

        <AuthSubmit disabled={code.length !== CODE_LENGTH}>Verify code</AuthSubmit>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mute">
        Didn&rsquo;t get it?{' '}
        {seconds > 0 ? (
          <span className="font-semibold text-ink tabular-nums">Resend in 0:{String(seconds).padStart(2, '0')}</span>
        ) : (
          <button type="button" onClick={resend} className="font-semibold text-accent hover:underline">
            Resend code
          </button>
        )}
      </p>

      {demoCode && (
        <div className="mt-6 rounded-2xl bg-accent-soft/70 p-4 text-caption text-ink-soft">
          <p className="font-semibold text-ink">Demo mode</p>
          <p className="mt-1">
            No email is actually sent. Your code is{' '}
            <button
              type="button"
              className="font-bold tracking-[0.2em] text-accent hover:underline"
              onClick={() => setCode(demoCode)}
            >
              {demoCode}
            </button>
          </p>
        </div>
      )}
    </AuthShell>
  )
}
