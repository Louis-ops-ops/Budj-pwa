// Grouped lists shared by both styles (Figma: Pro/Ligne, Pro/Ligne menu,
// Pro/Ligne action, Pro/Séparateur). A group is a rounded card; rows are
// separated by an inset line.
import { Children, Fragment, type ReactNode } from 'react'
import { Icon, type IconName } from '../../components/Icon'
import { Text } from '../../components/Text'
import styles from './List.module.css'

export function ListGroup({
  children,
  surface = 'brand-subtle',
  label
}: {
  children: ReactNode
  surface?: 'brand-subtle' | 'sheet' | 'surface'
  label?: string
}): React.JSX.Element {
  const rows = Children.toArray(children).filter(Boolean)
  return (
    <div className={styles.group} data-surface={surface} role="group" aria-label={label}>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 && <div className={styles.separator} aria-hidden="true" />}
          {row}
        </Fragment>
      ))}
    </div>
  )
}

/** Small brand title above a group (Créer, Gérer…). */
export function ListSection({
  title,
  action,
  children
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}): React.JSX.Element {
  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.sectionHead}>
        <Text variant="label-medium" color="brand" as="h3">
          {title}
        </Text>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Circle({ icon, tone }: { icon: IconName; tone?: 'danger' }): React.JSX.Element {
  return (
    <span className={styles.circle} data-tone={tone}>
      <Icon name={icon} size={20} />
    </span>
  )
}

/** Pro/Ligne action: brand label, no chevron (+ Nouvelle catégorie). */
export function ActionRow({
  icon,
  label,
  onClick,
  tone
}: {
  icon: IconName
  label: string
  onClick(): void
  tone?: 'danger'
}): React.JSX.Element {
  return (
    <button type="button" className={styles.row} data-tone={tone} onClick={onClick}>
      <Circle icon={icon} tone={tone} />
      <Text variant="body-medium" as="span" className={`${styles.grow} ${styles.actionLabel}`}>
        {label}
      </Text>
    </button>
  )
}

/** Pro/Ligne menu: icon, label, optional value, chevron. */
export function MenuRow({
  icon,
  label,
  value,
  valueTone,
  onClick,
  tone
}: {
  icon?: IconName
  label: string
  value?: string
  valueTone?: 'brand'
  onClick(): void
  tone?: 'danger'
}): React.JSX.Element {
  return (
    <button type="button" className={styles.row} data-tone={tone} onClick={onClick}>
      {icon && <Circle icon={icon} tone={tone} />}
      <Text variant="body-medium" as="span" className={`${styles.grow} ${styles.menuLabel}`}>
        {label}
      </Text>
      {value !== undefined && (
        <Text variant="label-regular" color={valueTone ?? 'secondary'} as="span" tabular>
          {value}
        </Text>
      )}
      <Icon name="chevron" size={16} className={styles.chevron} />
    </button>
  )
}

/** Pro/Ligne menu opening a native select (its value on the right). */
export function SelectMenuRow<T extends string>({
  icon,
  label,
  value,
  options,
  onChange
}: {
  icon?: IconName
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange(value: T): void
}): React.JSX.Element {
  const current = options.find((o) => o.value === value)?.label ?? ''
  return (
    <label className={styles.row}>
      {icon && <Circle icon={icon} />}
      <Text variant="body-medium" as="span" className={`${styles.grow} ${styles.menuLabel}`}>
        {label}
      </Text>
      <Text variant="label-regular" color="secondary" as="span" aria-hidden="true">
        {current}
      </Text>
      <Icon name="chevron" size={16} className={styles.chevron} />
      <select
        className={styles.overlaySelect}
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

/** Pro/Ligne: leading visual, title + subtitle, trailing value. */
export function Row({
  leading,
  title,
  subtitle,
  trailing,
  trailingSub,
  onClick,
  selected
}: {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  trailingSub?: ReactNode
  onClick?(): void
  selected?: boolean
}): React.JSX.Element {
  const content = (
    <>
      {leading}
      <span className={styles.texts}>
        <Text variant="body-medium" as="span" className={styles.title}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="label-regular" color="secondary" as="span" className={styles.title}>
            {subtitle}
          </Text>
        )}
      </span>
      {(trailing || trailingSub) && (
        <span className={styles.trailing}>
          {trailing && (
            <Text variant="body-medium" as="span" tabular>
              {trailing}
            </Text>
          )}
          {trailingSub && (
            <Text variant="label-regular" color="secondary" as="span" tabular>
              {trailingSub}
            </Text>
          )}
        </span>
      )}
    </>
  )
  return onClick ? (
    <button type="button" className={styles.row} data-selected={selected} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={styles.row} data-selected={selected}>
      {content}
    </div>
  )
}

/** Pro/Ligne formulaire: label on the left, value on the right (read-only summary). */
export function FormRow({
  label,
  value,
  tone,
  strong
}: {
  label: string
  value: ReactNode
  tone?: 'success' | 'danger' | 'brand'
  strong?: boolean
}): React.JSX.Element {
  return (
    <div className={styles.formRow}>
      <Text variant="body-regular" color="secondary" as="span" className={styles.grow}>
        {label}
      </Text>
      <Text
        variant={strong ? 'body-bold' : 'body-medium'}
        color={tone ?? 'primary'}
        as="span"
        tabular
      >
        {value}
      </Text>
    </div>
  )
}

/** Pro/Ligne interrupteur: role switch + aria-checked (v3 §9). */
export function SwitchRow({
  label,
  hint,
  checked,
  onChange
}: {
  label: string
  hint?: string
  checked: boolean
  onChange(value: boolean): void
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.row}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.texts}>
        <Text variant="body-medium" as="span" className={styles.menuLabel}>
          {label}
        </Text>
        {hint && (
          <Text variant="label-regular" color="secondary" as="span">
            {hint}
          </Text>
        )}
      </span>
      <span className={styles.switch} data-on={checked} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </button>
  )
}
