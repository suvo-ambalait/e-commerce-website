import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { usePersistedState } from './usePersistedState'

type ThemeChoice = 'light' | 'dark' | 'system'

interface ThemeValue {
  choice: ThemeChoice
  resolved: 'light' | 'dark'
  setChoice: (choice: ThemeChoice) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = usePersistedState<ThemeChoice>('maison:theme', 'system')

  const resolved: 'light' | 'dark' =
    choice === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : choice

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark = choice === 'dark' || (choice === 'system' && systemPrefersDark())
      root.classList.toggle('dark', dark)
      root.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()
    if (choice !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', apply)
    return () => mql.removeEventListener('change', apply)
  }, [choice])

  const value = useMemo<ThemeValue>(
    () => ({
      choice,
      resolved,
      setChoice,
      toggle: () => setChoice(resolved === 'dark' ? 'light' : 'dark'),
    }),
    [choice, resolved, setChoice],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
