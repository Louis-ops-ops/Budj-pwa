import type { CSSProperties, KeyboardEvent } from 'react'
import { CATEGORY_COLORS, type CategoryColor } from '../shared/types'
import { huePaint, hueContrast, hueSample, presetPaint, type Paint } from '../data/colors'
import { Text } from './Text'
import styles from './ColorSwatchPicker.module.css'

const NAMES: Record<CategoryColor, string> = {
  vert: 'Vert',
  mauve: 'Mauve',
  orange: 'Orange',
  rouge: 'Rouge',
  cyan: 'Cyan'
}

export interface ColorChoice {
  color: CategoryColor
  /** Set when a custom hue was picked with the slider. */
  customHue?: number
}

interface ColorSwatchPickerProps {
  value: ColorChoice
  onChange(choice: ColorChoice): void
  label?: string
}

// Track of the slider: the vivid color of every 30° step.
const HUE_STOPS = Array.from({ length: 13 }, (_, i) => hueSample(i * 30)).join(', ')
const TRACK = `linear-gradient(to right, ${HUE_STOPS})`
const WHEEL = `conic-gradient(from 90deg, ${HUE_STOPS})`
const DEFAULT_HUE = 250

const swatchStyle = (paint: Paint): CSSProperties =>
  ({ '--swatch-bg': paint.bg, '--swatch-fg': paint.fg }) as CSSProperties

/** 5 preset swatches + a custom hue slider. Every result meets WCAG AA (4.5:1). */
export function ColorSwatchPicker({
  value,
  onChange,
  label = 'Couleur'
}: ColorSwatchPickerProps): React.JSX.Element {
  const custom = value.customHue !== undefined
  const hue = value.customHue ?? DEFAULT_HUE
  const ratio = hueContrast(hue)

  const onKeyDown = (e: KeyboardEvent): void => {
    const i = custom ? CATEGORY_COLORS.length : CATEGORY_COLORS.indexOf(value.color)
    const count = CATEGORY_COLORS.length + 1
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (step === 0) return
    e.preventDefault()
    const next = (i + step + count) % count
    onChange(
      next === CATEGORY_COLORS.length
        ? { color: value.color, customHue: hue }
        : { color: CATEGORY_COLORS[next] }
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.group} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
        {CATEGORY_COLORS.map((color) => {
          const selected = !custom && color === value.color
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={NAMES[color]}
              title={NAMES[color]}
              tabIndex={selected ? 0 : -1}
              className={[styles.ring, selected ? styles.selected : ''].join(' ')}
              style={swatchStyle(presetPaint(color))}
              onClick={() => onChange({ color })}
            >
              <span className={styles.swatch} />
            </button>
          )
        })}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          aria-label="Couleur personnalisée"
          title="Couleur personnalisée"
          tabIndex={custom ? 0 : -1}
          className={[styles.ring, custom ? styles.selected : ''].join(' ')}
          style={swatchStyle(huePaint(hue))}
          onClick={() => onChange({ color: value.color, customHue: hue })}
        >
          <span
            className={`${styles.swatch} ${styles.customSwatch}`}
            style={{ '--wheel': WHEEL } as CSSProperties}
          >
            {custom && <span className={styles.customInner} />}
          </span>
        </button>
      </div>

      <div className={styles.slider}>
        <div className={styles.sliderHead}>
          <Text variant="label-medium" as="span" color="tertiary" id="hue-label">
            Teinte personnalisée
          </Text>
          {custom && (
            <Text variant="label-regular" as="span" color="success" tabular>
              Contraste {ratio.toFixed(1).replace('.', ',')}:1 · accessible
            </Text>
          )}
        </div>
        <input
          type="range"
          min={0}
          max={359}
          step={1}
          value={hue}
          aria-labelledby="hue-label"
          aria-valuetext={`Teinte ${hue}°, contraste ${ratio.toFixed(1)} pour 1`}
          className={styles.range}
          style={{ '--track': TRACK, '--thumb': hueSample(hue) } as CSSProperties}
          onChange={(e) => onChange({ color: value.color, customHue: Number(e.target.value) })}
        />
      </div>
    </div>
  )
}
