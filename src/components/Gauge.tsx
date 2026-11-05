import type { CSSProperties } from 'react'
import { cssColor } from '../data/colors'
import styles from './Gauge.module.css'

interface GaugeProps {
  /** spent / budget, can exceed 1 (clamped visually). */
  ratio: number
  /** CSS color token name ("bg-accent") or a category paint value. */
  fill: string
  track?: string
  height?: 'regular' | 'strong'
  label?: string
}

const clamp = (r: number): number => (Number.isFinite(r) ? Math.min(Math.max(r, 0), 1) : 1)

/** Track + fill, width proportional to the exact ratio. */
export function Gauge({
  ratio,
  fill,
  track = 'bg-surface',
  height = 'regular',
  label
}: GaugeProps): React.JSX.Element {
  const style = {
    '--ratio': clamp(ratio),
    '--gauge-fill': cssColor(fill),
    '--gauge-track': `var(--${track})`,
    '--gauge-height': height === 'strong' ? 'var(--layout-gauge-strong)' : 'var(--layout-gauge)'
  } as CSSProperties
  return (
    <div
      className={styles.track}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className={styles.fill} />
    </div>
  )
}

export interface GaugeSegment {
  value: number
  /** CSS color token name. */
  color: string
  label: string
}

/** Gauge in several segments, widths strictly proportional to their values. */
export function StackedGauge({
  segments,
  label
}: {
  segments: GaugeSegment[]
  label: string
}): React.JSX.Element {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0)
  return (
    <div className={styles.stacked} role="img" aria-label={label}>
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div
            key={s.label}
            className={styles.segment}
            style={{
              flexBasis: `${(s.value / total) * 100}%`,
              background: `var(--${s.color})`
            }}
          />
        ))}
    </div>
  )
}
