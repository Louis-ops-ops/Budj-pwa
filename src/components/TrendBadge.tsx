import { Icon } from './Icon'
import styles from './TrendBadge.module.css'

interface TrendBadgeProps {
  /** Color: good (positive), bad (negative) or neutral. */
  tone: 'positive' | 'negative' | 'neutral'
  /** Arrow: follows the sign of the number, independently of the tone. */
  direction: 'up' | 'down' | 'flat'
  label: string
}

/** Figma: Badge évolution (187:21). */
export function TrendBadge({ tone, direction, label }: TrendBadgeProps): React.JSX.Element {
  return (
    <span className={`t-label-medium tabular ${styles.badge} ${styles[tone]}`}>
      <Icon
        name={direction === 'up' ? 'trendUp' : direction === 'down' ? 'trendDown' : 'clock'}
        size={16}
      />
      {label}
    </span>
  )
}
