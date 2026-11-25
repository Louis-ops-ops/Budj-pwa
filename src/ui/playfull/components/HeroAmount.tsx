import { formatNumber } from '../../../data/money'
import styles from './HeroAmount.module.css'

/** Figma: « 177€ » of Mon budget, 128 px figure with a 48 px euro sign. */
export function HeroAmount({
  cents,
  danger = false
}: {
  cents: number
  danger?: boolean
}): React.JSX.Element {
  const euros = Math.floor(Math.abs(cents) / 100)
  return (
    <p className={`${styles.amount} tabular`} data-danger={danger}>
      <span className={styles.figure}>{formatNumber(euros)}</span>
      <span className={styles.unit}>€</span>
    </p>
  )
}
