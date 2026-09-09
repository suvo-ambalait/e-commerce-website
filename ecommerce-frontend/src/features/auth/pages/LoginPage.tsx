import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Button, Container, Field, Input, Section } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  useDocumentTitle('Sign in · MorerDokan')
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const dest = (location.state as { from?: string } | null)?.from ?? '/account'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const nextUser = mode === 'signin' ? login(email, password) : signup(name, email, password)
    navigate(
      nextUser.role === 'admin' ? '/admin' : nextUser.role === 'vendor' ? '/vendor/dashboard' : dest,
      { replace: true },
    )
  }

  return (
    <Section>
      <Container size="narrow" className="max-w-md">
        <div className="flex rounded-full bg-surface-sunken p-1">
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 rounded-full py-2 text-sm transition-colors',
                mode === m ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute',
              )}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={submit}
            className="mt-8 space-y-4"
          >
            <h1 className="text-2xl text-ink">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>

            {mode === 'signup' && (
              <Field label="Full name" required>
                {(id) => <Input id={id} required value={name} onChange={(e) => setName(e.target.value)} />}
              </Field>
            )}
            <Field label="Email" required>
              {(id) => (
                <Input id={id} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              )}
            </Field>
            <Field label="Password" required>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>

            {mode === 'signin' && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-caption text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button type="submit" size="lg" fullWidth>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </motion.form>
        </AnimatePresence>

        <div className="mt-6 rounded-lg border border-border bg-surface-sunken/60 p-4 text-caption text-ink-soft">
          <p className="font-medium text-ink">Demo accounts</p>
          <p className="mt-1">Shopper — any email · Password anything</p>
          <p>Vendor — <button type="button" className="text-accent hover:underline" onClick={() => { setEmail('studio@lumen.example'); setMode('signin') }}>studio@lumen.example</button></p>
          <p>Admin — <button type="button" className="text-accent hover:underline" onClick={() => { setEmail(ADMIN_EMAIL); setMode('signin') }}>{ADMIN_EMAIL}</button></p>
        </div>

        <p className="mt-6 text-center text-caption text-ink-mute">
          Want to sell?{' '}
          <Link to="/vendor/signup" className="text-accent hover:underline">
            Apply for a studio
          </Link>
        </p>
      </Container>
    </Section>
  )
}
