import type { CSSProperties, ReactNode } from 'react'
import type { CategoryColor } from '../shared/types'
import { toPaint, type Paint } from '../data/colors'
import { Icon } from './Icon'
import styles from './Chip.module.css'

interface CategoryChipProps {
  label: string
  color: CategoryColor | 'bleu' | Paint
  selected: boolean
  onClick(): void
}

export function CategoryChip({
  label,
  color,
  selected,
  onClick
}: CategoryChipProps): React.JSX.Element {
  const paint = toPaint(color)
  const style = { '--chip-bg': paint.bg, '--chip-fg': paint.fg } as CSSProperties
  return (
    <button
      type="button"
      className={[
        styles.chip,
        selected ? styles.selected : '',
        color === 'bleu' ? styles.outlined : ''
      ].join(' ')}
      style={style}
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function AddChip({ label, onClick }: { label: string; onClick(): void }): React.JSX.Element {
  return (
    <button type="button" className={[styles.chip, styles.add].join(' ')} onClick={onClick}>
      <Icon name="add" size={16} />
      {label}
    </button>
  )
}

export function ChipList({
  children,
  label
}: {
  children: ReactNode
  label: string
}): React.JSX.Element {
  return (
    <div className={styles.list} role="group" aria-label={label}>
      {children}
    </div>
  )
}
