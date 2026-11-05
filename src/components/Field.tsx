import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Text } from './Text'
import styles from './Field.module.css'

interface FieldShellProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
  invalid?: boolean
}

function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  children,
  invalid
}: FieldShellProps): React.JSX.Element {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor} className={`t-label-medium ${styles.label}`}>
        {label}
      </label>
      <div className={[styles.box, invalid ? styles.invalid : ''].join(' ')}>{children}</div>
      {error ? (
        <Text variant="label-regular" className={styles.error}>
          {error}
        </Text>
      ) : (
        hint && (
          <Text variant="label-regular" className={styles.hint}>
            {hint}
          </Text>
        )
      )}
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label: string
  value: string
  onChange(value: string): void
  hint?: string
  error?: string
  suffix?: string
  autoFocusOnOpen?: boolean
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  suffix,
  autoFocusOnOpen,
  id,
  className,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <FieldShell label={label} htmlFor={inputId} hint={hint} error={error} invalid={Boolean(error)}>
      <input
        id={inputId}
        className={[styles.input, className ?? ''].join(' ')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error) || undefined}
        data-autofocus={autoFocusOnOpen ? '' : undefined}
        autoComplete="off"
        {...rest}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </FieldShell>
  )
}

interface DateFieldProps {
  label: string
  /** YYYY-MM-DD */
  value: string
  display: string
  onChange(value: string): void
  max?: string
}

/** Compact date picker of the mobile sheet header (Figma: DateChip). */
export function DateChip({
  value,
  display,
  onChange,
  max
}: {
  value: string
  display: string
  onChange(value: string): void
  max?: string
}): React.JSX.Element {
  return (
    <label className={`t-label-medium ${styles.dateChip}`}>
      <Icon name="calendar" size={16} />
      {display}
      <input
        type="date"
        className={styles.dateInput}
        value={value}
        max={max}
        aria-label={`Date : ${display}`}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
      />
    </label>
  )
}

export function DateField({
  label,
  value,
  display,
  onChange,
  max
}: DateFieldProps): React.JSX.Element {
  const id = useId()
  return (
    <FieldShell label={label} htmlFor={id}>
      <Icon name="calendar" size={18} className={styles.dateIcon} />
      <span className={styles.dateValue} aria-hidden="true">
        {display}
      </span>
      <input
        id={id}
        type="date"
        className={styles.dateInput}
        value={value}
        max={max}
        aria-label={`${label} : ${display}`}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
      />
    </FieldShell>
  )
}

interface SelectFieldProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange(value: T): void
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange
}: SelectFieldProps<T>): React.JSX.Element {
  const id = useId()
  return (
    <FieldShell label={label} htmlFor={id}>
      <select
        id={id}
        className={[styles.input, styles.select].join(' ')}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron" size={16} rotate={90} className={styles.selectChevron} />
    </FieldShell>
  )
}
