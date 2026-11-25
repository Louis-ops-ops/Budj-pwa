import styles from './Pill.module.css'

/** Figma: Pro/Pilule (388:1456). Quick adjustments, suggestions, selectors. */
export function Pill({
  label,
  selected = false,
  onClick
}: {
  label: string
  selected?: boolean
  onClick(): void
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={`t-label-medium tabular ${styles.pill}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function Pills({
  children,
  label
}: {
  children: React.ReactNode
  label: string
}): React.JSX.Element {
  return (
    <div className={styles.row} role="group" aria-label={label}>
      {children}
    </div>
  )
}
