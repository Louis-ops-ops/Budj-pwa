import type { CSSProperties } from 'react'
import type { CategoryColor } from '../shared/types'
import { toPaint, type Paint } from '../data/colors'
import { Gauge } from './Gauge'
import { Icon } from './Icon'
import { Text } from './Text'
import styles from './CategoryRow.module.css'

interface CategoryRowProps {
  /** Preset ("bleu" is reserved for fixed expenses) or a category paint. */
  color: CategoryColor | 'bleu' | Paint
  name: string
  detail: string
  spentLabel: string
  remaining: string
  remainingLabel: string
  ratio: number
  onClick?: () => void
  /** Narrow preview: no gauge column. */
  compact?: boolean
}

export function CategoryRow({
  color,
  name,
  detail,
  spentLabel,
  remaining,
  remainingLabel,
  ratio,
  onClick,
  compact
}: CategoryRowProps): React.JSX.Element {
  const over = ratio > 1
  const paint = toPaint(color)
  const style = { '--row-bg': paint.bg, '--row-fg': paint.fg } as CSSProperties
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={[styles.row, over ? styles.over : '', compact ? styles.compact : ''].join(' ')}
      style={style}
      onClick={onClick}
    >
      <span className={styles.identity}>
        <Text variant="h3" as="span">
          {name}
        </Text>
        <Text variant="label-regular" as="span" tabular>
          {detail}
        </Text>
      </span>
      {!compact && (
        <span className={styles.progress}>
          <Gauge ratio={ratio} fill={over ? 'bg-danger' : paint.fg} />
          <Text variant="label-regular" as="span" tabular>
            {spentLabel}
          </Text>
        </span>
      )}
      <span className={styles.remaining}>
        <Text variant="h2" as="span" tabular>
          {remaining}
        </Text>
        <Text variant="label-regular" as="span">
          {remainingLabel}
        </Text>
      </span>
      {!compact && <Icon name="chevron" size={20} className={styles.chevron} />}
    </Tag>
  )
}
