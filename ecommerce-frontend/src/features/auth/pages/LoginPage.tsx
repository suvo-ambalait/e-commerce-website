import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LuLock, LuUser } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { MailIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { AuthCheckbox, AuthField, AuthShell, AuthSubmit, AuthTitle, SellPrompt } from '../components/AuthLayout'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  useDocumentTitle('Sign in · AmbalaEshop')
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // UI only for now — not yet used by submit
  const [remember, setRemember] = useState(true)


  const submit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = { name, email, password };
    console.log('Form submitted:', data);
  }

  return (
    <AuthShell footer={<SellPrompt />}>
      {/* mode switch */}
      <div className="flex rounded-full bg-surface-sunken p-1">
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={cn(
              'h-9 flex-1 rounded-full text-sm font-semibold transition-colors',
              mode === m ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink',
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
          className="mt-7 space-y-5"
        >
          <AuthTitle
            subtitle={
              mode === 'signin'
                ? 'Sign in to see your orders and saved items.'
                : 'Use one account to buy from every shop on AmbalaEshop.'
            }
          >
            {mode === 'signin' ? (
              <>
                Welcome <em>back</em>
              </>
            ) : (
              <>
                Create your <em>account</em>
              </>
            )}
          </AuthTitle>

          {mode === 'signup' && (
            <AuthField
              label="Full name"
              icon={<LuUser className="h-4 w-4" />}
              required
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <AuthField
            label="Email"
            icon={<MailIcon className="h-4 w-4" />}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthField
            label="Password"
            icon={<LuLock className="h-4 w-4" />}
            type="password"
            required
            minLength={4}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder={mode === 'signin' ? 'Your password' : 'Create a password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            labelAside={
              mode === 'signin' && (
                <Link to="/forgot-password" className="text-caption font-semibold text-accent hover:underline">
                  Forgot password?
                </Link>
              )
            }
          />

          {mode === 'signin' && (
            <AuthCheckbox label="Keep me signed in" checked={remember} onChange={setRemember} />
          )}

          <AuthSubmit>{mode === 'signin' ? 'Sign in' : 'Create account'}</AuthSubmit>
        </motion.form>
      </AnimatePresence>
    </AuthShell>
  )
}
