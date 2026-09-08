/**
 * Tiny class-name joiner. Accepts strings, falsy values and arrays.
 * Deliberately dependency-free — we don't need full tailwind-merge conflict
 * resolution because primitives own their own class strings and callers
 * append, not override.
 */
export type ClassValue = string | number | null | false | undefined | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  const walk = (value: ClassValue) => {
    if (!value) return
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    out.push(String(value))
  }
  inputs.forEach(walk)
  return out.join(' ')
}
