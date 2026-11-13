import { useEffect, useId, useRef, useState } from 'react'
import { isStandalone } from '../platform/install'
import { motionMs } from '../ui/motion'
import styles from './Splash.module.css'

// Outfit Bold "B" of the app icon (public/favicon.svg), in its 512 grid.
const LETTER =
  'M266.54 376.02L164.20 376.02L164.20 135.98L267.22 135.98Q290.34 135.98 306.49 144.48Q322.64 152.98 331.14 167.26Q339.64 181.54 339.64 198.88Q339.64 220.98 325.36 236.28Q319.24 242.74 310.40 247.84Q322.64 253.62 331.48 262.80Q347.80 280.48 347.80 306.32Q347.80 326.04 338.11 341.85Q328.42 357.66 310.23 366.84Q292.04 376.02 266.54 376.02M261.44 271.30L216.90 271.30L216.90 334.54L261.44 334.54Q277.08 334.54 285.92 325.36Q294.76 316.18 294.76 302.92Q294.76 293.74 290.68 286.60Q286.60 279.46 279.29 275.38Q271.98 271.30 261.44 271.30M257.02 177.46L216.90 177.46L216.90 230.84L257.02 230.84Q270.28 230.84 278.44 224.21Q286.60 217.58 286.60 203.98Q286.60 190.72 278.44 184.09Q270.28 177.46 257.02 177.46'

// Pen strokes along the middle of the letter, in writing order: the stem, then each bowl.
// Thicker than the letter and clipped to it, so they fill it as they go.
const STROKES = [
  'M190.5 136V376',
  'M164 157H257C300 157 313 176 313 204C313 232 297 251 257 251H190',
  'M190 251H262C306 251 321 275 321 303C321 333 302 355 262 355H164'
]

/** Launch screen of the installed app: the "B" written, while the data loads. */
export function shouldShowSplash(): boolean {
  return isStandalone() && motionMs('--motion-splash') > 0
}

export function Splash({ ready, onDone }: { ready: boolean; onDone(): void }): React.JSX.Element {
  const clipId = useId()
  const [written, setWritten] = useState(false)
  const leaving = written && ready
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
      <svg className={styles.logo} viewBox="150 122 212 268">
        <clipPath id={clipId}>
          <path d={LETTER} />
        </clipPath>
        <path d={LETTER} className={styles.track} />
        <g clipPath={`url(#${clipId})`}>
          {STROKES.map((d, i) => (
            <path
              key={d}
              d={d}
              pathLength={1}
              className={styles.stroke}
              data-step={i}
              onAnimationEnd={i === STROKES.length - 1 ? () => setWritten(true) : undefined}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
