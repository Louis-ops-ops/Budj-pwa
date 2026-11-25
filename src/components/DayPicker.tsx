import { useEffect, useRef } from 'react'
import styles from './DayPicker.module.css'

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

/** Horizontal row of the days of a month (mobile fixed expense sheet). */
export function DayPicker({
  value,
  onChange
}: {
  value: number
  onChange(day: number): void
}): React.JSX.Element {
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Centers the chosen day by scrolling the row only (scrollIntoView would
  // also move the sheet and the page behind it).
  useEffect(() => {
    const day = selectedRef.current
    const row = day?.parentElement
    if (!day || !row) return
    row.scrollLeft = day.offsetLeft - (row.clientWidth - day.offsetWidth) / 2
  }, [])

  return (
    <div className={styles.row} role="radiogroup" aria-label="Jour du prélèvement">
      {DAYS.map((day) => (
        <button
          key={day}
          ref={day === value ? selectedRef : undefined}
          type="button"
          role="radio"
          aria-checked={day === value}
          className={`tabular ${day === value ? 't-body-bold' : 't-body-regular'} ${styles.day} ${day === value ? styles.selected : ''}`}
          onClick={() => onChange(day)}
        >
          {day}
        </button>
      ))}
    </div>
  )
}
