import { useEffect, useRef, useState } from 'react'

/** A duration token of tokens.css, in ms (0 with reduced motion). */
export function motionMs(token: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const ms = Number.parseFloat(value)
  if (Number.isNaN(ms)) return 0
  return value.endsWith('ms') ? ms : ms * 1000
}

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3

/**
 * Follows `value`, rolling through the numbers in between when it changes.
 * The first render shows the value as is.
 */
export function useCountUp(value: number): number {
  const [shown, setShown] = useState(value)
  const shownRef = useRef(value)

  useEffect(() => {
    const from = shownRef.current
    if (from === value) return
    const duration = motionMs('--motion-count')
    const delay = motionMs('--motion-count-delay')
    let frame = 0
    let start = 0

    const set = (n: number): void => {
      shownRef.current = n
      setShown(n)
    }
    const step = (now: number): void => {
      if (start === 0) start = now
      const t = Math.min(1, (now - start) / duration)
      set(t >= 1 ? value : Math.round(from + (value - from) * easeOutCubic(t)))
      if (t < 1) frame = requestAnimationFrame(step)
    }

    if (duration === 0) {
      set(value)
      return
    }
    // Lets the sheet slide away first, so the change is seen.
    const timer = setTimeout(() => (frame = requestAnimationFrame(step)), delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [value])

  return shown
}
