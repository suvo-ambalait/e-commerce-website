import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LuKeyRound } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, Container, Field, Input, Section } from '@/shared/ui'
import { AuthIntro } from '../components/AuthIntro'
import { issueChallenge } from '../lib/recovery'

export function ForgotPasswordPage() {
  useDocumentTitle('Reset password · MorerDokan')
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
    <Section>
      <Container size="narrow" className="max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AuthIntro backTo="/login" backLabel="Back to sign in" icon={<LuKeyRound className="h-5 w-5" />} title="Forgot your password?">
            Enter the email on your account and we&rsquo;ll send a 6-digit code to reset it.
          </AuthIntro>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email" required>
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  required
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>

            <Button type="submit" size="lg" fullWidth>
              Send reset code
            </Button>
          </form>

          <p className="mt-6 text-center text-caption text-ink-mute">
            Remembered it?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </Container>
    </Section>
  )
}
