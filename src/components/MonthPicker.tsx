import { useEffect, useRef, useState } from 'react'
import { formatMonthYear } from '../data/dates'
import { Icon } from './Icon'
import styles from './MonthPicker.module.css'

interface MonthPickerProps {
  value: string
  /** Available months, oldest first. */
  months: string[]
  onChange(month: string): void
}

export function MonthPicker({ value, months, onChange }: MonthPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const ordered = [...months].reverse()

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
    const onDown = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (!open) return
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []
    )
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[Math.min(index + 1, items.length - 1)]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[Math.max(index - 1, 0)]?.focus()
    }
  }

  return (
    <div className={styles.root} ref={rootRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        className={`t-label-medium ${styles.trigger}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {formatMonthYear(value)}
        <Icon name="chevron" size={16} rotate={open ? 270 : 90} />
      </button>
      {open && (
        <div className={styles.menu} role="listbox" ref={listRef} aria-label="Choisir un mois">
          {ordered.map((m) => (
            <button
              type="button"
              role="option"
              key={m}
              aria-selected={m === value}
              className={`t-label-medium ${styles.option}`}
              onClick={() => {
                onChange(m)
                setOpen(false)
              }}
            >
              {formatMonthYear(m)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
