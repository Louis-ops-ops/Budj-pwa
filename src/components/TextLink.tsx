import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './TextLink.module.css'

interface TextLinkProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string
  icon?: IconName
  iconPosition?: 'left' | 'right'
  tone?: 'brand' | 'danger'
}

export function TextLink({
  label,
  icon,
  iconPosition = 'left',
  tone = 'brand',
  className,
  ...rest
}: TextLinkProps): React.JSX.Element {
  const glyph = icon && <Icon name={icon} size={16} />
  return (
    <button
      type="button"
      className={[styles.link, tone === 'danger' ? styles.danger : '', className ?? ''].join(' ')}
      {...rest}
    >
      {iconPosition === 'left' && glyph}
      {label}
      {iconPosition === 'right' && glyph}
    </button>
  )
}
