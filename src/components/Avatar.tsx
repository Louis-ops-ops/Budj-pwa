import type { CSSProperties } from 'react'
import type { CategoryColor } from '../shared/types'
import { toPaint, type Paint } from '../data/colors'
import styles from './Avatar.module.css'

interface AvatarProps {
  /** Preset ("bleu" for fixed expenses), a category paint, or "uncategorized". */
  color: CategoryColor | 'bleu' | Paint | 'uncategorized'
  initial: string
}

/** Figma: Avatar (233:253) — initial on a colored disc. */
export function Avatar({ color, initial }: AvatarProps): React.JSX.Element {
  const uncategorized = color === 'uncategorized'
  const paint = uncategorized ? null : toPaint(color)
  return (
    <span
      className={[
        styles.avatar,
        uncategorized ? styles.uncategorized : '',
        color === 'bleu' ? styles.outlined : ''
      ].join(' ')}
      style={
        paint ? ({ '--avatar-bg': paint.bg, '--avatar-fg': paint.fg } as CSSProperties) : undefined
      }
      aria-hidden="true"
    >
      {initial.slice(0, 1).toUpperCase()}
    </span>
  )
}
