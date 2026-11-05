import { useRef, type ClipboardEvent } from 'react'
import { centsToInput, parseAmount, sanitizeAmountText } from '../data/money'
import styles from './AmountInput.module.css'

interface AmountInputProps {
  /** Raw text as typed: digits, at most one comma and two decimals. */
  value: string
  onChange(value: string): void
  label: string
  autoFocus?: boolean
  size?: 'regular' | 'compact'
}

const LONG_AMOUNT = 5

/** "1900,5" → "1 900,5" for display. */
function group(text: string): string {
  const [units, decimals] = text.split(',')
  const grouped = units.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
  return decimals === undefined ? grouped : `${grouped},${decimals}`
}

export function AmountInput({
  value,
  onChange,
  label,
  autoFocus,
  size = 'regular'
}: AmountInputProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const empty = value === ''

  const onPaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    const cents = parseAmount(e.clipboardData.getData('text'))
    e.preventDefault()
    if (cents !== null) onChange(centsToInput(cents))
  }

  const valueClass = size === 'compact' ? 't-display-m' : 't-display-xl'
  const currencyClass = size === 'compact' ? 't-h1' : 't-display-m'

  return (
    <div
      className={[
        styles.wrapper,
        size === 'compact' ? styles.compact : '',
        group(value).length > LONG_AMOUNT ? styles.long : ''
      ].join(' ')}
      onClick={() => inputRef.current?.focus()}
    >
      <span
        className={[valueClass, 'tabular', styles.value, empty ? styles.empty : ''].join(' ')}
        aria-hidden="true"
      >
        {empty ? '0' : group(value)}
      </span>
      <span className={styles.cursor} aria-hidden="true" />
      <span className={[currencyClass, styles.currency].join(' ')} aria-hidden="true">
        €
      </span>
      <input
        ref={inputRef}
        className={styles.input}
        inputMode="decimal"
        autoComplete="off"
        aria-label={`${label} en euros`}
        value={value}
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? '' : undefined}
        onChange={(e) => onChange(sanitizeAmountText(e.target.value))}
        onPaste={onPaste}
      />
    </div>
  )
}
