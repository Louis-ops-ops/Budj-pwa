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

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
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
