import { useId } from 'react'
import { formatNumber, sanitizeAmountText } from '../../data/money'
import styles from './AmountField.module.css'

/**
 * Figma: Pro/Champ montant (435:539), shared by both styles. Empty, it shows
 * the suggestion as a grey placeholder (state « Suggestion »); the suggestion
 * is announced, not read as a typed value (v3 §9).
 */
export function AmountField({
  value,
  onChange,
  label,
  suggestion
}: {
  value: string
  onChange(value: string): void
  /** Full label, e.g. « Budget de Courses, en euros ». */
  label: string
  /** Cents. */
  suggestion?: number
}): React.JSX.Element {
  const hintId = useId()
  const hint = suggestion !== undefined ? formatNumber(Math.round(suggestion / 100)) : undefined
  return (
    <span className={styles.field}>
      <input
        className={`tabular ${styles.input}`}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={hint}
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        onChange={(e) => onChange(sanitizeAmountText(e.target.value))}
      />
      <span className={styles.unit} aria-hidden="true">
        €
      </span>
      {hint && (
        <span id={hintId} className="sr-only">
          suggestion : {hint} €
        </span>
      )}
    </span>
  )
}
