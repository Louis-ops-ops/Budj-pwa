// Building blocks of the mobile bottom sheets, shared by both styles
// (Figma: Pro/Ligne formulaire, Pro/Note, Pro/Saisie montant, chips row).
import { useId, useRef, type CSSProperties, type ReactNode } from 'react'
import type { Paint } from '../../data/colors'
import { Icon, type IconName } from '../../components/Icon'
import { Text } from '../../components/Text'
import styles from './SheetParts.module.css'

/** Pro/Note: small pill under an amount (impact, gap, info). */
export function Note({
  children,
  tone = 'neutral',
  paint,
  live
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'danger'
  /** Impact on a category: its colors. */
  paint?: Paint
  live?: boolean
}): React.JSX.Element {
  const style = paint
    ? ({ '--note-bg': paint.bg, '--note-fg': paint.fg } as CSSProperties)
    : undefined
  return (
    <span
      className={`t-label-medium tabular ${styles.note}`}
      data-tone={paint ? 'paint' : tone}
      style={style}
      aria-live={live ? 'polite' : undefined}
    >
      {children}
    </span>
  )
}

/** Big amount of a sheet, with the line under it (hint or note). */
export function SheetAmount({
  children,
  below
}: {
  children: ReactNode
  below?: ReactNode
}): React.JSX.Element {
  return (
    <div className={styles.amount}>
      {children}
      {below}
    </div>
  )
}

/** Grey sentence under an empty amount (« Saisis le montant… »). */
export function AmountHint({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <Text variant="label-regular" color="secondary" as="p" className={styles.hint}>
      {children}
    </Text>
  )
}

/** Small grey title above a block (Catégorie, Après modification…). */
export function SheetBlock({
  title,
  aside,
  children
}: {
  title: string
  aside?: ReactNode
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <Text variant="label-medium" color="secondary" as="span">
          {title}
        </Text>
        {aside}
      </div>
      {children}
    </div>
  )
}

/** Single line of chips that scrolls sideways, edge to edge. */
export function ChipRow({
  label,
  children
}: {
  label: string
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {children}
    </div>
  )
}

/** Card of form rows (Formulaire): bg/surface, rows separated by an inset line. */
export function FormCard({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className={styles.card}>{children}</div>
}

function Chevron(): React.JSX.Element {
  return <Icon name="chevron" size={16} className={styles.chevron} />
}

/** Pro/Ligne formulaire with a text input on the right. */
export function TextRow({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  suffix
}: {
  label: string
  value: string
  onChange(value: string): void
  placeholder?: string
  maxLength?: number
  inputMode?: 'decimal'
  /** Unit after the value (€). */
  suffix?: string
}): React.JSX.Element {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className={styles.row} onClick={() => inputRef.current?.focus()}>
      <label htmlFor={id} className={`t-body-regular ${styles.label}`}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        className={`t-body-medium ${styles.input}`}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        enterKeyHint="done"
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix && (
        <span className="t-body-medium" aria-hidden="true">
          {suffix}
        </span>
      )}
      <Chevron />
    </div>
  )
}

/** Pro/Ligne formulaire opening the native date picker. */
export function DateRow({
  label,
  value,
  display,
  onChange,
  max
}: {
  label: string
  value: string
  display: string
  onChange(value: string): void
  max?: string
}): React.JSX.Element {
  return (
    <label className={styles.row}>
      <span className={`t-body-regular ${styles.label}`}>{label}</span>
      <span className={`t-body-medium ${styles.value}`} aria-hidden="true">
        {display}
      </span>
      <Chevron />
      <input
        type="date"
        className={styles.overlayInput}
        value={value}
        max={max}
        aria-label={`${label} : ${display}`}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
      />
    </label>
  )
}

/** Pro/Ligne formulaire opening a native select. */
export function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange(value: T): void
}): React.JSX.Element {
  const current = options.find((o) => o.value === value)?.label ?? ''
  return (
    <label className={styles.row}>
      <span className={`t-body-regular ${styles.label}`}>{label}</span>
      <span className={`t-body-medium ${styles.value}`} aria-hidden="true">
        {current}
      </span>
      <Chevron />
      <select
        className={styles.overlayInput}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Pro/Ligne formulaire, read only (recaps): label left, value right. */
export function ValueRow({
  label,
  value,
  tone
}: {
  label: string
  value: ReactNode
  tone?: 'success' | 'danger' | 'brand'
}): React.JSX.Element {
  return (
    <div className={styles.row}>
      <span className={`t-body-regular ${styles.label}`}>{label}</span>
      <Text
        variant="body-medium"
        color={tone ?? 'primary'}
        as="span"
        tabular
        className={styles.value}
      >
        {value}
      </Text>
    </div>
  )
}

/** −50 / −10 / +10 / +50 (sheets Budget mensuel, Budget de [catégorie]). */
export function QuickSteps({
  steps,
  format,
  onStep
}: {
  steps: number[]
  format(step: number): string
  onStep(step: number): void
}): React.JSX.Element {
  return (
    <div className={styles.steps} role="group" aria-label="Ajuster rapidement">
      {steps.map((step) => (
        <button
          key={step}
          type="button"
          className={`t-label-medium tabular ${styles.step}`}
          onClick={() => onStep(step)}
        >
          {format(step)}
        </button>
      ))}
    </div>
  )
}

/** Choice pills (suggestions 50 / 100 / 150 / 200 €), the current one in accent. */
export function ChoicePills<T extends string | number>({
  label,
  options,
  value,
  onChange
}: {
  label: string
  options: { value: T; label: string }[]
  value: T | null
  onChange(value: T): void
}): React.JSX.Element {
  return (
    <div className={styles.steps} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`t-label-medium tabular ${styles.step}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Warning box of a confirmation (danger) or an info box (brand). */
export function Callout({
  icon,
  tone,
  children
}: {
  icon: IconName
  tone: 'danger' | 'brand'
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className={`t-label-medium ${styles.callout}`} data-tone={tone}>
      <Icon name={icon} size={20} className={styles.calloutIcon} />
      <span>{children}</span>
    </div>
  )
}
