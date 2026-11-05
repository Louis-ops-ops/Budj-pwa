import type { KeyboardEvent } from 'react'
import styles from './ThemePicker.module.css'

export type ThemeChoice = 'light' | 'dark'

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' }
]

interface ThemePickerProps {
  value: ThemeChoice
  onChange(theme: ThemeChoice): void
}

/** Two cards, each showing a miniature of the app in that theme. */
export function ThemePicker({ value, onChange }: ThemePickerProps): React.JSX.Element {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    // Enter validates the surrounding step instead of re-selecting the card.
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.closest('form')?.requestSubmit()
      return
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      onChange(value === 'light' ? 'dark' : 'light')
      e.currentTarget.querySelector<HTMLElement>('[aria-checked="false"]')?.focus()
    }
  }

  return (
    <div className={styles.group} role="radiogroup" aria-label="Thème" onKeyDown={onKeyDown}>
      {OPTIONS.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            autoFocus={selected}
            className={[styles.option, selected ? styles.selected : ''].join(' ')}
            onClick={() => onChange(o.value)}
          >
            <span className={styles.preview} data-theme={o.value} aria-hidden="true">
              <span className={styles.sidebar}>
                <span className={styles.brand} />
                <span className={styles.cta} />
                <span className={styles.nav} />
                <span className={styles.navLine} />
                <span className={styles.navLine} />
              </span>
              <span className={styles.content}>
                <span className={styles.card}>
                  <span className={styles.caption} />
                  <span className={styles.amount} />
                  <span className={styles.gauge}>
                    <span className={styles.gaugeFill} />
                  </span>
                </span>
                <span className={`${styles.row} ${styles.rowVert}`} />
                <span className={`${styles.row} ${styles.rowMauve}`} />
                <span className={`${styles.row} ${styles.rowCyan}`} />
              </span>
            </span>
            <span className={`t-body-medium ${styles.label}`}>
              <span className={styles.radio} aria-hidden="true" />
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
