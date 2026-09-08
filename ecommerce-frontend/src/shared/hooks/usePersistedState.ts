import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * `useState` mirrored to localStorage. Collapses the load / save / try-catch
 * boilerplate that every context in this app used to hand-roll.
 *
 * - reads once on mount (lazy initializer), falling back to `initialValue`
 * - writes on every change
 * - tolerates private-mode / disabled storage without throwing
 * - `initialValue` may be a factory so callers can defer expensive seed data
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T | (() => T),
): [T, (next: T | ((prev: T) => T)) => void] {
  const readInitial = (): T => {
    const fallback = () =>
      typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : fallback()
    } catch {
      return fallback()
    }
  }

  const [state, setState] = useState<T>(readInitial)
  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(state))
    } catch {
      /* storage unavailable — degrade to in-memory state */
    }
  }, [state])

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next))
  }, [])

  return [state, set]
}
