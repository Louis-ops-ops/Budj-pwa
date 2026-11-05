import type { CSSProperties } from 'react'
import { formatEuroSigned } from '../data/money'
import { formatMonthShort, formatMonthYear } from '../data/dates'
import styles from './SavingsChart.module.css'

interface SavingsChartProps {
  months: { month: string; value: number }[]
  selected: string
  onSelect(month: string): void
}

/** Savings bars: height = |value| ÷ max(|values|), positive above the axis, negative below. */
export function SavingsChart({ months, selected, onSelect }: SavingsChartProps): React.JSX.Element {
  const max = Math.max(...months.map((m) => Math.abs(m.value)), 1)
  // Whole euros for the labels.
  const rounded = (cents: number): number => Math.round(cents / 100) * 100

  return (
    <div className={styles.chart}>
      <div className={styles.bars} role="group" aria-label="Économies des derniers mois">
        {months.map(({ month, value }) => {
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
    </div>
  )
}
