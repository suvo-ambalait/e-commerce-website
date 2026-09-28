import { useEffect, useState } from 'react'

/**
 * Counts from 0 up to `to` once, with an ease-out curve.
 * Jumps straight to the value when the user prefers reduced motion.
 */
export function useCountUp(to: number, { duration = 1100, decimals = 0 } = {}) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }
    const f = 10 ** decimals
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3)) * f) / f)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, duration, decimals])
  return value
}
