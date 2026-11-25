// Pro building blocks (Figma page Composants, section UI - Pro 394:449).
import type { ReactNode } from 'react'
import type { Paint } from '../../../data/colors'
import { formatNumber } from '../../../data/money'
import { Avatar } from '../../../components/Avatar'
import { Text } from '../../../components/Text'
import styles from './ProBlocks.module.css'

/** Pro/Héros montant: label, euros in Display/M with small cents, subline. */
export function ProHero({
  label,
  cents,
  sub,
  danger = false
}: {
  label: string
  cents: number
  sub?: ReactNode
  danger?: boolean
}): React.JSX.Element {
  const abs = Math.abs(cents)
  const euros = formatNumber(Math.floor(abs / 100))
  const rest = String(abs % 100).padStart(2, '0')
  return (
    <div className={styles.hero}>
      <Text variant="body-regular" as="p" className={styles.heroLabel}>
        {label}
      </Text>
      <p className={`tabular ${styles.heroAmount}`} data-danger={danger}>
        <span className={styles.heroEuros}>
          {cents < 0 ? '−' : ''}
          {euros}
        </span>
        <span className={styles.heroCents}>,{rest} €</span>
      </p>
      {sub && (
        <Text variant="label-regular" as="p" className={styles.heroLabel}>
          {sub}
        </Text>
      )}
    </div>
  )
}

/** Grouped card on bg/sheet (radius lg) with an optional Pro/En-tête de carte. */
export function ProCard({
  title,
  count,
  action,
  children,
  label
}: {
  title?: string
  count?: string
  action?: { label: string; onClick(): void }
  children: ReactNode
  label?: string
}): React.JSX.Element {
  return (
    <section className={styles.card} aria-label={label ?? title}>
      {title && (
        <div className={styles.cardHead}>
          <Text variant="h3" as="h2" className={styles.cardTitle}>
            {title}
          </Text>
          {count && (
            <Text variant="label-regular" color="secondary" as="span">
              {count}
            </Text>
          )}
          <span className={styles.grow} />
          {action && (
            <button type="button" className={`t-label-medium ${styles.cardAction}`} onClick={action.onClick}>
              {action.label}
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

/** Pro/Ligne, variant Jauge: avatar, title + sub, amount + detail, thin gauge underneath. */
export function GaugeRow({
  paint,
  initial,
  title,
  subtitle,
  amount,
  detail,
  ratio,
  gaugeColor,
  amountTone,
  onClick,
  ariaLabel
}: {
  paint: Paint
  initial: string
  title: string
  subtitle?: string
  amount: string
  detail?: string
  /** 0–1 (clamped); omitted: no gauge. */
  ratio?: number
  gaugeColor?: string
  amountTone?: 'success' | 'danger'
  onClick?(): void
  ariaLabel?: string
}): React.JSX.Element {
  const content = (
    <>
      <span className={styles.rowMain}>
        <Avatar color={paint} initial={initial} />
        <span className={styles.texts}>
          <Text variant="body-medium" as="span" className={styles.ellipsis}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="label-regular" color="secondary" as="span" className={styles.ellipsis}>
              {subtitle}
            </Text>
          )}
        </span>
        <span className={styles.amounts}>
          <Text variant="body-medium" color={amountTone ?? 'primary'} as="span" tabular>
            {amount}
          </Text>
          {detail && (
            <Text variant="label-regular" color="secondary" as="span" tabular>
              {detail}
            </Text>
          )}
        </span>
      </span>
      {ratio !== undefined && (
        <span className={styles.gauge} aria-hidden="true">
          <span
            className={styles.gaugeFill}
            style={{
              width: `${Math.min(1, Math.max(0, ratio)) * 100}%`,
              background: gaugeColor ?? paint.fg
            }}
          />
        </span>
      )}
    </>
  )
  return onClick ? (
    <button type="button" className={styles.row} onClick={onClick} aria-label={ariaLabel}>
      {content}
    </button>
  ) : (
    <div className={styles.row} aria-label={ariaLabel}>
      {content}
    </div>
  )
}

/** Pro/Note: small pill of information (évolution, impact, filtre actif). */
export function ProNote({
  children,
  tone = 'success'
}: {
  children: ReactNode
  tone?: 'success' | 'danger' | 'brand'
}): React.JSX.Element {
  return (
    <span className={`t-label-medium ${styles.note}`} data-tone={tone}>
      {children}
    </span>
  )
}
