import type { CSSProperties } from 'react'
import type { AvatarColor } from '../../shared/types'
import styles from './ProfileAvatar.module.css'

/** The user's avatar: initial of the first name on their color (Profile, Pro top bar). */
export function ProfileAvatar({
  initial,
  color,
  size = 'large'
}: {
  initial: string
  color: AvatarColor
  size?: 'large' | 'small'
}): React.JSX.Element {
  return (
    <span
      className={styles.avatar}
      data-size={size}
      style={
        {
          '--avatar-bg': `var(--category-${color}-bg)`,
          '--avatar-fg': `var(--category-${color}-fg)`
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
