import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LuShieldCheck } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, Container, Section } from '@/shared/ui'
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
    <Section>
      <Container size="narrow" className="max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AuthIntro
            backTo="/forgot-password"
            backLabel="Use a different email"
            icon={<LuShieldCheck className="h-5 w-5" />}
            title="Enter the 6-digit code"
          >
            We sent a code to <span className="font-medium text-ink">{email}</span>. It expires in 10 minutes.
          </AuthIntro>

          <form onSubmit={submit} className="mt-8 space-y-4">
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
            {error && <p className="text-caption text-danger">{error}</p>}

            <Button type="submit" size="lg" fullWidth disabled={code.length !== CODE_LENGTH}>
              Verify code
            </Button>
          </form>

          <p className="mt-6 text-center text-caption text-ink-mute">
            Didn&rsquo;t get it?{' '}
            {seconds > 0 ? (
              <span>
                Resend in 0:{String(seconds).padStart(2, '0')}
              </span>
            ) : (
              <button type="button" onClick={resend} className="text-accent hover:underline">
                Resend code
              </button>
            )}
          </p>

          {demoCode && (
            <div className="mt-6 rounded-lg border border-border bg-surface-sunken/60 p-4 text-caption text-ink-soft">
              <p className="font-medium text-ink">Demo mode</p>
              <p className="mt-1">
                No email is actually sent. Your code is{' '}
                <button
                  type="button"
                  className="font-medium tracking-[0.2em] text-accent hover:underline"
                  onClick={() => setCode(demoCode)}
                >
                  {demoCode}
                </button>
              </p>
            </div>
          )}
        </motion.div>
      </Container>
    </Section>
  )
}
