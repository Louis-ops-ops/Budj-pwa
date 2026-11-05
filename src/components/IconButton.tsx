import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './IconButton.module.css'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName
  /** Required: used as aria-label and tooltip. */
  label: string
  tone?: 'brand' | 'danger'
  iconRotate?: 0 | 45 | 180
}

export function IconButton({
  icon,
  label,
  tone = 'brand',
  iconRotate = 0,
  className,
  ...rest
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[styles.hit, tone === 'danger' ? styles.danger : '', className ?? ''].join(' ')}
      {...rest}
    >
      <span className={styles.visual}>
        <Icon name={icon} size={16} rotate={iconRotate} />
      </span>
    </button>
  )
}
