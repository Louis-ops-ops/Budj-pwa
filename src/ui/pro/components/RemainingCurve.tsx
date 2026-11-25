import type { RemainingCurve as Curve } from '../../../data/selectors'
import { formatEuroFloor } from '../../../data/money'
import styles from './RemainingCurve.module.css'

const WIDTH = 393
const HEIGHT = 100
const TOP = 8
const BOTTOM = 92

/**
 * Figma: Courbe du restant (389:4163). Dashed ideal pace from the spendable
 * amount down to 0, real remaining up to today, today's dot.
 */
export function RemainingCurve({ curve }: { curve: Curve }): React.JSX.Element | null {
  if (curve.length === 0 || curve.start <= 0) return null
  const lowest = Math.min(0, ...curve.points)
  const span = curve.start - lowest || 1
  const x = (day: number): number => (day / curve.length) * WIDTH
  const y = (value: number): number => TOP + ((curve.start - value) / span) * (BOTTOM - TOP)
  const zero = y(0)
  const real = [`M0 ${y(curve.start)}`, ...curve.points.map((v, i) => `L${x(i + 1)} ${y(v)}`)].join(' ')
  const last = curve.points.length
  const today = last > 0 && last < curve.length ? { cx: x(last), cy: y(curve.points[last - 1]) } : null
  const remaining = curve.points[last - 1] ?? curve.start
  const ideal = curve.start - (curve.start * last) / curve.length

  return (
    <figure className={styles.curve}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Restant ${formatEuroFloor(remaining)}, rythme idéal ${formatEuroFloor(ideal)}`}
      >
        <line
          x1="0"
          y1={y(curve.start)}
          x2={WIDTH}
          y2={zero}
          className={styles.ideal}
          vectorEffect="non-scaling-stroke"
        />
        {last > 0 && <path d={real} className={styles.real} vectorEffect="non-scaling-stroke" />}
      </svg>
      {today && (
        <span
          className={styles.today}
          style={{ left: `${(today.cx / WIDTH) * 100}%`, top: `${today.cy}px` }}
          aria-hidden="true"
        >
          <span className={styles.dot} />
          <span className={`t-caption-medium ${styles.label}`}>Auj.</span>
        </span>
      )}
    </figure>
  )
}
