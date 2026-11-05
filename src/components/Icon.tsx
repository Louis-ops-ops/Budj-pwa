import { icons, type IconName } from './icons'

export type IconColor =
  | 'icon-primary'
  | 'icon-brand'
  | 'icon-on-accent'
  | 'icon-muted'
  | 'icon-danger'
  | `category-${'vert' | 'mauve' | 'orange' | 'rouge' | 'cyan' | 'bleu'}-fg`
  | 'inherit'

interface IconProps {
  name: IconName
  size?: 16 | 18 | 20 | 24
  color?: IconColor
  className?: string
  /** Rotation in degrees (the chevron points right by default). */
  rotate?: 0 | 45 | 90 | 180 | 270
}

export function Icon({
  name,
  size = 20,
  color = 'inherit',
  className,
  rotate = 0
}: IconProps): React.JSX.Element {
  const Glyph = icons[name]
  return (
    <Glyph
      width={size}
      height={size}
      className={className}
      style={{
        flexShrink: 0,
        color: color === 'inherit' ? undefined : `var(--${color})`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined
      }}
    />
  )
}

export type { IconName }
