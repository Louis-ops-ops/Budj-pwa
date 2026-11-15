import { useEffect, useRef, useState } from 'react'
import { isStandalone } from '../platform/install'
import { motionMs } from '../ui/motion'
import styles from './Splash.module.css'

// Budj logo (scripts/logo.svg): four tiles, in the order they appear.
const TILES = [
  'M12 113.621H88a12 12 0 0 1 12 12v76a12 12 0 0 1-12 12H12a12 12 0 0 1-12-12v-76a12 12 0 0 1 12-12Z',
  'M124.752 113.621h76a12 12 0 0 1 12 12v76a12 12 0 0 1-12 12h-76a12 12 0 0 1-12-12v-76a12 12 0 0 1 12-12Z',
  'M12 0H88a12 12 0 0 1 12 12v76a12 12 0 0 1-12 12H12a12 12 0 0 1-12-12V12A12 12 0 0 1 12 0Z',
  'M124.752 0h76a12 12 0 0 1 12 12v76a12 12 0 0 1-12 12h-76a12 12 0 0 1-12-12V12a12 12 0 0 1 12-12Z'
]

// The arrow of the last tile, drawn as pen strokes in the background color:
// the shaft from bottom left, then the head from its corner.
const ARROW = [
  'M130.9 81.84L194.64 18.12',
  'M194.64 18.12H130.87',
  'M194.64 18.12V81.88'
]

/** Launch screen of the installed app: the logo builds up while the data loads. */
export function shouldShowSplash(): boolean {
  return isStandalone() && motionMs('--motion-splash') > 0
}

export function Splash({ ready, onDone }: { ready: boolean; onDone(): void }): React.JSX.Element {
  const [built, setBuilt] = useState(false)
  const leaving = built && ready
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  // Safety net: never keep the app behind the splash.
  useEffect(() => {
    const timer = setTimeout(() => onDoneRef.current(), motionMs('--motion-splash') * 4)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={styles.splash}
      data-leaving={leaving || undefined}
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (leaving && e.target === e.currentTarget) onDone()
      }}
    >
      <svg className={styles.logo} viewBox="0 0 212.752 213.621">
        {TILES.map((d, i) => (
          <path key={d} d={d} className={styles.tile} data-step={i} />
        ))}
        {ARROW.map((d, i) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            className={styles.arrow}
            data-step={i}
            onAnimationEnd={i === ARROW.length - 1 ? () => setBuilt(true) : undefined}
          />
        ))}
      </svg>
    </div>
  )
}
