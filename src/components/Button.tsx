import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './Button.module.css'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
  icon?: IconName
  fullWidth?: boolean
}

export function Button({
  label,
  variant = 'primary',
  icon,
  fullWidth,
  className,
  type = 'button',
  ...rest
}: ButtonProps): React.JSX.Element {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className ?? ''
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {icon && <Icon name={icon} size={20} />}
      {label}
    </button>
  )
}
