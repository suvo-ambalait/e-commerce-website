import { useSyncExternalStore } from 'react'

type Updater<T> = T | ((prev: T) => T)

/**
 * A tiny shared, localStorage-backed store. Every component that calls
 * `useStore()` sees the same value and re-renders on change — unlike
 * `usePersistedState`, which gives each caller its own copy.
 *
 * Used for the marketplace data that has no backend endpoint yet (returns,
 * payouts, staff, delivery zones…). Swap each store for API calls later.
 */
export function createStore<T>(key: string, initial: T | (() => T)) {
  const fallback = () => (typeof initial === 'function' ? (initial as () => T)() : initial)

  let state: T = (() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : fallback()
    } catch {
      return fallback()
    }
  })()

  const listeners = new Set<() => void>()

  const set = (next: Updater<T>) => {
    state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* storage unavailable — keep in memory */
    }
    listeners.forEach((l) => l())
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const get = () => state

  function useStore(): [T, (next: Updater<T>) => void] {
    const value = useSyncExternalStore(subscribe, get, get)
    return [value, set]
  }

  return { useStore, get, set }
}

/** Short random id with a readable prefix, e.g. `ret-k3j9x2`. */
export const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`
