import type { ElementType, ReactNode } from 'react'

export type TextVariant =
  | 'display-xl'
  | 'display-l'
  | 'display-m'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body-regular'
  | 'body-medium'
  | 'body-bold'
  | 'label-regular'
  | 'label-medium'
  | 'label-bold'
  | 'caption-medium'

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'on-accent'
  | 'brand'
  | 'brand-strong'
  | 'brand-subtle'
  | 'brand-faint'
  | 'brand-deep'
  | 'success'
  | 'danger'
  | 'inherit'

interface TextProps {
  variant: TextVariant
  color?: TextColor
  as?: ElementType
  tabular?: boolean
  className?: string
  id?: string
  children: ReactNode
}

export function Text({
  variant,
  color = 'inherit',
  as: Tag = 'p',
  tabular,
  className,
  id,
  children
}: TextProps): React.JSX.Element {
  const classes = [`t-${variant}`, tabular ? 'tabular' : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <Tag
      id={id}
      className={classes}
      style={color === 'inherit' ? undefined : { color: `var(--text-${color})` }}
    >
      {children}
    </Tag>
  )
}
