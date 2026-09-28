/** Remembers which shop this browser applied for, so the status page can find it. */
const KEY = 'vendor:application'

export function rememberApplication(vendorId: string) {
  try {
    window.localStorage.setItem(KEY, vendorId)
  } catch {
    /* storage unavailable — the status page falls back to a lookup form */
  }
}

export function readApplication(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}
