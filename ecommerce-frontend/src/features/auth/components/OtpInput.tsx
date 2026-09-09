import { useMemo, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'

interface OtpInputProps {
  value: string
  onChange: (next: string) => void
  length?: number
  autoFocus?: boolean
  invalid?: boolean
  disabled?: boolean
  onComplete?: (code: string) => void
}

/**
 * Segmented one-time-code field. Renders `length` single-character boxes that
 * behave as one input: typing advances, backspace retreats, and pasting a code
 * fills every box at once. The parent owns the value as a plain string.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  invalid = false,
  disabled = false,
  onComplete,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = useMemo(
    () => Array.from({ length }, (_, i) => value[i] ?? ''),
    [value, length],
  )

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index))
    refs.current[clamped]?.focus()
    refs.current[clamped]?.select()
  }

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1)
    if (!char) return
    const arr = digits.slice()
    arr[index] = char
    commit(arr.join(''))
    focusBox(index + 1)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = digits.slice()
      if (arr[index]) {
        arr[index] = ''
        commit(arr.join(''))
      } else {
        arr[index - 1] = ''
        commit(arr.join(''))
        focusBox(index - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusBox(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusBox(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    commit(pasted)
    focusBox(pasted.length)
  }

  return (
    <div className="flex gap-2 sm:gap-3" role="group" aria-label={`${length}-digit verification code`}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-invalid={invalid}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'field-focus h-13 w-full min-w-0 rounded-md border bg-surface text-center text-lg font-medium text-ink outline-none transition-[color,border-color,box-shadow] duration-[var(--dur-1)] hover:border-ink-mute disabled:cursor-not-allowed disabled:opacity-50',
            invalid
              ? 'border-danger shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_16%,transparent)]'
              : 'border-border-strong',
          )}
        />
      ))}
    </div>
  )
}
