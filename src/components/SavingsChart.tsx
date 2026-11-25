import type { CSSProperties } from 'react'
import { formatEuroSigned } from '../data/money'
import { formatMonthShort, formatMonthYear } from '../data/dates'
import styles from './SavingsChart.module.css'

interface SavingsChartProps {
  /** `goal`: savings goal of that month (v3 §7.8), drawn as a dashed line on the same scale. */
  months: { month: string; value: number; goal?: number }[]
  selected: string
  onSelect(month: string): void
  /** Text description of the goal line, e.g. « objectif 100 € par mois ; atteint 2 mois sur 6 ». */
  goalLabel?: string
}

/** Savings bars: height = |value| ÷ max(|values|), positive above the axis, negative below. */
export function SavingsChart({
  months,
  selected,
  onSelect,
  goalLabel
}: SavingsChartProps): React.JSX.Element {
  const max = Math.max(...months.map((m) => Math.max(Math.abs(m.value), m.goal ?? 0)), 1)
  const hasGoal = months.some((m) => (m.goal ?? 0) > 0)
  // Whole euros for the labels.
  const rounded = (cents: number): number => Math.round(cents / 100) * 100

  return (
    <div className={styles.chart}>
      <div className={styles.bars} role="group" aria-label="Économies des derniers mois">
        {months.map(({ month, value, goal }) => {
          const up = value >= 0
          const style = { '--ratio': Math.abs(value) / max } as CSSProperties
          const label = formatEuroSigned(rounded(value))
          return (
            <button
              key={month}
              type="button"
              className={[styles.column, month === selected ? styles.selected : ''].join(' ')}
              aria-pressed={month === selected}
              aria-label={`${formatMonthYear(month)} : ${label}`}
              onClick={() => onSelect(month)}
            >
              <span className={styles.positive}>
                {(goal ?? 0) > 0 && (
                  <span
                    className={styles.goal}
                    style={{ '--goal': (goal ?? 0) / max } as CSSProperties}
                    aria-hidden="true"
                  />
                )}
                {up && (
                  <>
                    <span className={`t-label-regular tabular ${styles.value}`}>{label}</span>
                    <span className={`${styles.bar} ${styles.barUp}`} style={style} />
                  </>
                )}
              </span>
              <span className={styles.axis} />
              <span className={styles.negative}>
                {!up && (
                  <>
                    <span className={`${styles.bar} ${styles.barDown}`} style={style} />
                    <span className={`t-label-regular tabular ${styles.value} ${styles.valueDown}`}>
                      {label}
                    </span>
                  </>
                )}
              </span>
              <span className={`t-label-regular ${styles.month}`}>
                {formatMonthShort(month).replace('.', '')}
              </span>
            </button>
          )
        })}
      </div>
      {hasGoal && (
        <p className={`t-label-regular ${styles.legend}`}>
          <span className={styles.legendLine} aria-hidden="true" />
          {goalLabel ?? 'Objectif d’épargne'}
        </p>
      )}
    </div>
  )
}

const GHOSTS = [0.45, 0.7, 0.35, 0.85, 0.55, 0.65]

/** Figma 13 · États vides: dashed ghost bars during the first month. */
export function GhostChart(): React.JSX.Element {
  return (
    <div className={styles.ghosts} aria-hidden="true">
      {GHOSTS.map((ratio, i) => (
        <span key={i} className={styles.ghost} style={{ '--ratio': ratio } as CSSProperties} />
      ))}
    </div>
  )
}
