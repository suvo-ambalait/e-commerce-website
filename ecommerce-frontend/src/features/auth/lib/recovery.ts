/**
 * Demo-only password recovery. There is no mail server, so the "sent" code is
 * generated in the browser and kept in sessionStorage for the length of the
 * flow. The verify page reads it back to check the entry and to show the hint
 * box, mirroring the "Demo accounts" panel on the sign-in page.
 */
const KEY = 'maison:auth:recovery'

export interface RecoveryChallenge {
  email: string
  code: string
  issuedAt: number
}

export function issueChallenge(email: string): RecoveryChallenge {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const challenge: RecoveryChallenge = { email: email.trim().toLowerCase(), code, issuedAt: Date.now() }
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(challenge))
  } catch {
    /* storage unavailable — flow still works via router state */
  }
  return challenge
}

export function readChallenge(): RecoveryChallenge | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RecoveryChallenge) : null
  } catch {
    return null
  }
}

export function clearChallenge(): void {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
